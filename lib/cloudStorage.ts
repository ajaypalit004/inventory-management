import { put, list } from "@vercel/blob";
import { InventoryUser, CatalogItem } from "@/types/inventory";
import { INITIAL_USERS, INITIAL_CATALOG } from "@/lib/initialData";

const BLOB_PATH = "inventory-data.json";

export interface CloudInventoryPayload {
  users: InventoryUser[];
  catalog: CatalogItem[];
  updatedAt: number;
}

export async function getCloudData(): Promise<CloudInventoryPayload> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      users: INITIAL_USERS,
      catalog: INITIAL_CATALOG,
      updatedAt: Date.now(),
    };
  }

  try {
    const { blobs } = await list({ prefix: BLOB_PATH });
    const target = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!target) {
      const initialPayload: CloudInventoryPayload = {
        users: INITIAL_USERS,
        catalog: INITIAL_CATALOG,
        updatedAt: Date.now(),
      };
      await saveCloudData(initialPayload.users, initialPayload.catalog);
      return initialPayload;
    }

    const response = await fetch(`${target.url}?t=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.users)) {
      // Corrupt or non-conforming data, reseed
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
