import { NextResponse } from "next/server";
import { getCloudData, saveCloudData } from "@/lib/cloudStorage";
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
    const { users, catalog } = body as {
      users?: InventoryUser[];
      catalog?: CatalogItem[];
    };

    if (!Array.isArray(users)) {
      return NextResponse.json(
        { error: "Invalid payload: 'users' array required" },
        { status: 400 }
      );
    }

    const saved = await saveCloudData(users, Array.isArray(catalog) ? catalog : []);
    return NextResponse.json(saved, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to save inventory data" },
      { status: 500 }
    );
  }
}
