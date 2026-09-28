import { put, list, del } from "@vercel/blob";
import { InventoryUser, CatalogItem, UserAssignment } from "@/types/inventory";
import { INITIAL_USERS, INITIAL_CATALOG } from "@/lib/initialData";

const BLOB_PREFIX = "inventory-state-";

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
    const listResult = await list({ prefix: BLOB_PREFIX, limit: 10 });

    if (listResult.blobs.length === 0) {
      // Check for legacy inventory-data.json
      const legacyList = await list({ prefix: "inventory-data" });
      const legacyBlob = legacyList.blobs.find((b) => b.pathname === "inventory-data.json");
      if (legacyBlob) {
        try {
          const res = await fetch(legacyBlob.url, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.users)) {
              const saved = await saveCloudData(
                data.users,
                Array.isArray(data.catalog) ? data.catalog : INITIAL_CATALOG
              );
              del(legacyBlob.url).catch(() => {});
              return saved;
            }
          }
        } catch {}
      }

      // No existing blobs, initialize with default state
      const initialPayload: CloudInventoryPayload = {
        users: INITIAL_USERS,
        catalog: INITIAL_CATALOG,
        updatedAt: Date.now(),
      };
      await saveCloudData(initialPayload.users, initialPayload.catalog);
      return initialPayload;
    }

    // Sort by uploadedAt descending to find true latest state
    const sorted = listResult.blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const latestBlob = sorted[0];

    const response = await fetch(latestBlob.url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status}`);
    }

    const data = await response.json();

    // Async prune older state blobs so store stays compact
    if (sorted.length > 1) {
      const oldUrls = sorted.slice(1).map((b) => b.url);
      del(oldUrls).catch(() => {});
    }

    return {
      users: Array.isArray(data.users) ? data.users : INITIAL_USERS,
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

  // Versioned pathname guarantees every save has a unique URL, completely eliminating CDN caching
  const newPathname = `${BLOB_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 6)}.json`;

  await put(newPathname, JSON.stringify(payload), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });

  // Clean up any older state blobs asynchronously
  list({ prefix: BLOB_PREFIX })
    .then((res) => {
      const olderBlobs = res.blobs.filter((b) => b.pathname !== newPathname);
      if (olderBlobs.length > 0) {
        del(olderBlobs.map((b) => b.url)).catch(() => {});
      }
    })
    .catch(() => {});

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

      // Clean up any catalog items that are no longer assigned to any user
      const updatedCatalog = current.catalog.filter((c) => {
        const catLower = c.name.trim().toLowerCase();
        return updatedUsers.some((u) =>
          u.assignments.some((a) => a.itemName.trim().toLowerCase() === catLower)
        );
      });

      return {
        users: updatedUsers,
        catalog: updatedCatalog,
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

export function queueActions(actions: InventoryAction[]): Promise<CloudInventoryPayload> {
  const operation = writeQueue.then(async () => {
    const current = await getCloudData();
    let next = current;
    for (const action of actions) {
      next = applyAction(next, action);
    }
    await saveCloudData(next.users, next.catalog);
    return next;
  });

  writeQueue = operation.catch(() => {}).then(() => {});
  return operation;
}

export function queueAction(action: InventoryAction): Promise<CloudInventoryPayload> {
  return queueActions([action]);
}
