import { put, get } from "@vercel/blob";
import { InventoryUser, CatalogItem, UserAssignment } from "@/types/inventory";
import { INITIAL_USERS, INITIAL_CATALOG } from "@/lib/initialData";

const BLOB_PATH = "inventory-data.json";

export interface CloudInventoryPayload {
  users: InventoryUser[];
  catalog: CatalogItem[];
  updatedAt: number;
}

export type InventoryAction =
  | { type: "ASSIGN_ITEM"; userId: string; itemName: string; quantity?: number; assignmentId?: string }
  | { type: "UPDATE_QUANTITY"; userId: string; assignmentId?: string; itemName?: string; delta: number }
  | { type: "REMOVE_ASSIGNMENT"; userId: string; assignmentId?: string; itemName?: string }
  | { type: "REMOVE_CATALOG_ITEM"; itemName: string }
  | { type: "ADD_USER"; name: string }
  | { type: "DELETE_USER"; userId: string }
  | { type: "RESET" }
  | { type: "SYNC_MERGE"; users: InventoryUser[]; catalog: CatalogItem[] };

export async function getCloudData(): Promise<CloudInventoryPayload> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      users: INITIAL_USERS,
      catalog: INITIAL_CATALOG,
      updatedAt: Date.now(),
    };
  }

  try {
    const result = await get(BLOB_PATH, {
      access: "public",
      useCache: false, // Bypasses Vercel Edge CDN cache completely
    });

    if (!result) {
      const initialPayload: CloudInventoryPayload = {
        users: INITIAL_USERS,
        catalog: INITIAL_CATALOG,
        updatedAt: Date.now(),
      };
      await saveCloudData(initialPayload.users, initialPayload.catalog);
      return initialPayload;
    }

    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);

    if (!Array.isArray(data.users)) {
      const initialPayload: CloudInventoryPayload = {
        users: INITIAL_USERS,
        catalog: INITIAL_CATALOG,
        updatedAt: Date.now(),
      };
      await saveCloudData(initialPayload.users, initialPayload.catalog);
      return initialPayload;
    }

    return {
      users: data.users,
      catalog: Array.isArray(data.catalog) ? data.catalog : INITIAL_CATALOG,
      updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
    };
  } catch (err) {
    console.error("Error reading cloud inventory data:", err);
    return {
      users: INITIAL_USERS,
      catalog: INITIAL_CATALOG,
      updatedAt: Date.now(),
    };
  }
}

export async function saveCloudData(
  users: InventoryUser[],
  catalog: CatalogItem[]
): Promise<CloudInventoryPayload> {
  const payload: CloudInventoryPayload = {
    users,
    catalog,
    updatedAt: Date.now(),
  };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("BLOB_READ_WRITE_TOKEN is missing, skipping cloud write");
    return payload;
  }

  await put(BLOB_PATH, JSON.stringify(payload), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });

  return payload;
}

export function applyAction(
  current: CloudInventoryPayload,
  action: InventoryAction
): CloudInventoryPayload {
  switch (action.type) {
    case "ASSIGN_ITEM": {
      const trimmedName = action.itemName.trim();
      if (!trimmedName) return current;
      const targetLower = trimmedName.toLowerCase();

      // 1. Case-insensitive Catalog resolution
      let existingCat = current.catalog.find(
        (c) => c.name.trim().toLowerCase() === targetLower
      );
      let updatedCatalog = current.catalog;
      if (!existingCat) {
        existingCat = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: trimmedName,
        };
        updatedCatalog = [existingCat, ...current.catalog];
      }

      // 2. Case-insensitive Assignment check on target user
      const updatedUsers = current.users.map((u) => {
        if (u.id !== action.userId) return u;

        const existingAssignIndex = u.assignments.findIndex(
          (a) => a.itemName.trim().toLowerCase() === targetLower
        );

        if (existingAssignIndex > -1) {
          const nextAssignments = [...u.assignments];
          const curr = nextAssignments[existingAssignIndex];
          nextAssignments[existingAssignIndex] = {
            ...curr,
            quantity: (curr.quantity || 1) + (action.quantity || 1),
          };
          return { ...u, assignments: nextAssignments };
        }

        const newAssignment: UserAssignment = {
          id: action.assignmentId || `assign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          itemId: existingCat.id,
          itemName: existingCat.name,
          quantity: action.quantity || 1,
        };

        return {
          ...u,
          assignments: [newAssignment, ...u.assignments],
        };
      });

      return {
        users: updatedUsers,
        catalog: updatedCatalog,
        updatedAt: Date.now(),
      };
    }

    case "UPDATE_QUANTITY": {
      const targetNameLower = action.itemName ? action.itemName.trim().toLowerCase() : null;
      const updatedUsers = current.users.map((u) => {
        if (u.id !== action.userId) return u;

        const nextAssignments = u.assignments
          .map((a) => {
            const matches =
              (action.assignmentId && a.id === action.assignmentId) ||
              (targetNameLower && a.itemName.trim().toLowerCase() === targetNameLower);

            if (!matches) return a;
            const newQty = (a.quantity || 1) + action.delta;
            return newQty > 0 ? { ...a, quantity: newQty } : null;
          })
          .filter(Boolean) as UserAssignment[];

        return { ...u, assignments: nextAssignments };
      });

      return {
        users: updatedUsers,
        catalog: current.catalog,
        updatedAt: Date.now(),
      };
    }

    case "REMOVE_ASSIGNMENT": {
      const targetNameLower = action.itemName ? action.itemName.trim().toLowerCase() : null;
      const updatedUsers = current.users.map((u) => {
        if (u.id !== action.userId) return u;
        return {
          ...u,
          assignments: u.assignments.filter((a) => {
            if (action.assignmentId && a.id === action.assignmentId) return false;
            if (targetNameLower && a.itemName.trim().toLowerCase() === targetNameLower) return false;
            return true;
          }),
        };
      });

      // If item is no longer assigned to ANY user, remove from catalog so suggestions stay clean
      let updatedCatalog = current.catalog;
      if (targetNameLower) {
        const stillInUse = updatedUsers.some((u) =>
          u.assignments.some((a) => a.itemName.trim().toLowerCase() === targetNameLower)
        );
        if (!stillInUse) {
          updatedCatalog = current.catalog.filter(
            (c) => c.name.trim().toLowerCase() !== targetNameLower
          );
        }
      }

      return {
        users: updatedUsers,
        catalog: updatedCatalog,
        updatedAt: Date.now(),
      };
    }

    case "REMOVE_CATALOG_ITEM": {
      const targetLower = action.itemName.trim().toLowerCase();
      // Remove item completely from catalog AND all assignments
      const updatedCatalog = current.catalog.filter(
        (c) => c.name.trim().toLowerCase() !== targetLower
      );

      const updatedUsers = current.users.map((u) => ({
        ...u,
        assignments: u.assignments.filter(
          (a) => a.itemName.trim().toLowerCase() !== targetLower
        ),
      }));

      return {
        users: updatedUsers,
        catalog: updatedCatalog,
        updatedAt: Date.now(),
      };
    }

    case "ADD_USER": {
      const trimmedName = action.name.trim();
      if (!trimmedName) return current;

      const newUser: InventoryUser = {
        id: `user-${Date.now()}`,
        name: trimmedName,
        assignments: [],
      };

      return {
        users: [newUser, ...current.users],
        catalog: current.catalog,
        updatedAt: Date.now(),
      };
    }

    case "DELETE_USER": {
      const updatedUsers = current.users.filter((u) => u.id !== action.userId);

      return {
        users: updatedUsers,
        catalog: current.catalog,
        updatedAt: Date.now(),
      };
    }

    case "RESET": {
      return {
        users: INITIAL_USERS,
        catalog: INITIAL_CATALOG,
        updatedAt: Date.now(),
      };
    }

    case "SYNC_MERGE": {
      const mergedUsers = current.users.map((serverUser) => {
        const clientUser = action.users.find(
          (cu) =>
            cu.id === serverUser.id ||
            cu.name.trim().toLowerCase() === serverUser.name.trim().toLowerCase()
        );
        if (!clientUser) return serverUser;

        const assignmentsMap = new Map<string, UserAssignment>();
        for (const a of serverUser.assignments) {
          assignmentsMap.set(a.itemName.trim().toLowerCase(), a);
        }
        for (const ca of clientUser.assignments) {
          const key = ca.itemName.trim().toLowerCase();
          if (assignmentsMap.has(key)) {
            const sa = assignmentsMap.get(key)!;
            assignmentsMap.set(key, {
              ...sa,
              quantity: Math.max(sa.quantity || 1, ca.quantity || 1),
            });
          } else {
            assignmentsMap.set(key, ca);
          }
        }

        return {
          ...serverUser,
          assignments: Array.from(assignmentsMap.values()),
        };
      });

      const serverNames = new Set(
        current.users.map((u) => u.name.trim().toLowerCase())
      );
      const newClientUsers = action.users.filter(
        (cu) => !serverNames.has(cu.name.trim().toLowerCase())
      );

      const catalogMap = new Map<string, CatalogItem>();
      for (const c of current.catalog) {
        catalogMap.set(c.name.trim().toLowerCase(), c);
      }
      for (const cc of action.catalog) {
        const key = cc.name.trim().toLowerCase();
        if (!catalogMap.has(key)) {
          catalogMap.set(key, cc);
        }
      }

      return {
        users: [...newClientUsers, ...mergedUsers],
        catalog: Array.from(catalogMap.values()),
        updatedAt: Date.now(),
      };
    }

    default:
      return current;
  }
}

// In-process serialization queue to prevent race conditions during concurrent serverless writes
let writeQueue = Promise.resolve();

export function queueAction(action: InventoryAction): Promise<CloudInventoryPayload> {
  const operation = writeQueue.then(async () => {
    const current = await getCloudData();
    const next = applyAction(current, action);
    await saveCloudData(next.users, next.catalog);
    return next;
  });

  writeQueue = operation.catch(() => {}).then(() => {});
  return operation;
}
