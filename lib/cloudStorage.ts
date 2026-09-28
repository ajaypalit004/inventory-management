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
  | { type: "ASSIGN_ITEM"; userId: string; itemName: string; quantity?: number }
  | { type: "UPDATE_QUANTITY"; userId: string; assignmentId: string; delta: number }
  | { type: "REMOVE_ASSIGNMENT"; userId: string; assignmentId: string }
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
    // CRITICAL: useCache: false completely bypasses Vercel Blob's 5-minute Edge CDN cache,
    // ensuring fresh data is retrieved from origin on every read.
    const result = await get(BLOB_PATH, {
      access: "public",
      useCache: false,
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

      // 1. Case-insensitive Catalog resolution
      let existingCat = current.catalog.find(
        (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
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
          (a) => a.itemName.trim().toLowerCase() === trimmedName.toLowerCase()
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
          id: `assign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      const updatedUsers = current.users.map((u) => {
        if (u.id !== action.userId) return u;

        const nextAssignments = u.assignments
          .map((a) => {
            if (a.id !== action.assignmentId) return a;
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
      const updatedUsers = current.users.map((u) => {
        if (u.id !== action.userId) return u;
        return {
          ...u,
          assignments: u.assignments.filter((a) => a.id !== action.assignmentId),
        };
      });

      return {
        users: updatedUsers,
        catalog: current.catalog,
        updatedAt: Date.now(),
      };
    }

    case "REMOVE_CATALOG_ITEM": {
      const targetLower = action.itemName.trim().toLowerCase();
      // Remove item from catalog so it is never recalled or suggested again
      const updatedCatalog = current.catalog.filter(
        (c) => c.name.trim().toLowerCase() !== targetLower
      );

      // Also clean up any assignment of this removed item from any user
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
      // Non-destructive merge:
      // Preserves all server assignments and merges client additions
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

      // Include new users added by client
      const serverNames = new Set(
        current.users.map((u) => u.name.trim().toLowerCase())
      );
      const newClientUsers = action.users.filter(
        (cu) => !serverNames.has(cu.name.trim().toLowerCase())
      );

      // Merge catalog case-insensitively
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
