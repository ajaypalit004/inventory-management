import { NextResponse } from "next/server";
import { getCloudData, queueAction, InventoryAction } from "@/lib/cloudStorage";
import { InventoryUser, CatalogItem } from "@/types/inventory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getCloudData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Explicit atomic action
    if (body.action && typeof body.action.type === "string") {
      const action = body.action as InventoryAction;
      const updated = await queueAction(action);
      return NextResponse.json(updated, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // 2. Full sync payload (handled safely with non-destructive SYNC_MERGE)
    const { users, catalog } = body as {
      users?: InventoryUser[];
      catalog?: CatalogItem[];
    };

    if (Array.isArray(users)) {
      const updated = await queueAction({
        type: "SYNC_MERGE",
        users,
        catalog: Array.isArray(catalog) ? catalog : [],
      });
      return NextResponse.json(updated, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid payload: provide 'action' or 'users' array" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to process inventory update" },
      { status: 500 }
    );
  }
}
