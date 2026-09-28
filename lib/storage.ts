import { CatalogItem, InventoryUser } from "@/types/inventory";
import { INITIAL_CATALOG, INITIAL_USERS } from "./initialData";

const USERS_STORAGE_KEY = "inventory_users_v5";
const CATALOG_STORAGE_KEY = "inventory_catalog_v5";

export function getStoredUsers(): InventoryUser[] {
  if (typeof window === "undefined") return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      // Check previous storage version to migrate any existing assignments for the 19 users
      const oldRaw = localStorage.getItem("inventory_users_v4");
      if (oldRaw) {
        try {
          const oldUsers: InventoryUser[] = JSON.parse(oldRaw);
          const migratedUsers = INITIAL_USERS.map((newUser) => {
            const match = oldUsers.find(
              (ou) => ou.name.toLowerCase().trim() === newUser.name.toLowerCase().trim()
            );
            return match && match.assignments && match.assignments.length > 0
              ? { ...newUser, assignments: match.assignments }
              : newUser;
          });
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(migratedUsers));
          return migratedUsers;
        } catch {
          // fallback to INITIAL_USERS
        }
      }
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load users from localStorage", err);
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: InventoryUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save users to localStorage", err);
  }
}

export function getStoredCatalog(): CatalogItem[] {
  if (typeof window === "undefined") return INITIAL_CATALOG;
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem("inventory_catalog_v4");
      if (oldRaw) {
        try {
          const oldCatalog = JSON.parse(oldRaw);
          localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(oldCatalog));
          return oldCatalog;
        } catch {}
      }
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(INITIAL_CATALOG));
      return INITIAL_CATALOG;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load catalog from localStorage", err);
    return INITIAL_CATALOG;
  }
}

export function saveStoredCatalog(items: CatalogItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save catalog to localStorage", err);
  }
}

export function resetAllData(): { users: InventoryUser[]; catalog: CatalogItem[] } {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(CATALOG_STORAGE_KEY);
  }
  return { users: INITIAL_USERS, catalog: INITIAL_CATALOG };
}
