import * as XLSX from "xlsx";
import { InventoryUser, CatalogItem } from "@/types/inventory";

export function exportInventoryToExcel(users: InventoryUser[], catalog: CatalogItem[]): void {
  // 1. Detailed Assignments Sheet (Row by row allocation per user)
  const detailedRows: Array<{
    "S.No.": number;
    "User Name": string;
    "Item Name": string;
    "Quantity": number;
    "Status": string;
  }> = [];

  let rowCounter = 1;
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  for (const user of sortedUsers) {
    const assignments = Array.isArray(user.assignments) ? user.assignments : [];
    if (assignments.length === 0) {
      detailedRows.push({
        "S.No.": rowCounter++,
        "User Name": user.name,
        "Item Name": "—",
        "Quantity": 0,
        "Status": "No items assigned",
      });
    } else {
      for (const a of assignments) {
        if (!a || !a.itemName) continue;
        detailedRows.push({
          "S.No.": rowCounter++,
          "User Name": user.name,
          "Item Name": a.itemName,
          "Quantity": a.quantity || 1,
          "Status": "Assigned",
        });
      }
    }
  }

  // 2. User Summary Sheet (Overview of each user and total items held)
  const summaryRows = sortedUsers.map((u, index) => {
    const assignments = Array.isArray(u.assignments) ? u.assignments : [];
    const totalQty = assignments.reduce((sum, a) => sum + (a.quantity || 1), 0);
    const breakdown = assignments.length > 0
      ? assignments.map((a) => `${a.itemName} (×${a.quantity || 1})`).join(", ")
      : "None";

    return {
      "S.No.": index + 1,
      "User Name": u.name,
      "Total Items Allocated": totalQty,
      "Unique Items Count": assignments.length,
      "Allocated Items Summary": breakdown,
    };
  });

  // 3. Catalog Inventory Sheet (Overview of each item and which users currently hold it)
  const sortedCatalog = [...catalog].sort((a, b) => a.name.localeCompare(b.name));
  const catalogRows = sortedCatalog.map((item, index) => {
    const itemLower = item.name.trim().toLowerCase();
    const allocatedUsers: string[] = [];
    let totalQty = 0;

    for (const u of sortedUsers) {
      const asgs = Array.isArray(u.assignments) ? u.assignments : [];
      const match = asgs.find((a) => a && a.itemName && a.itemName.trim().toLowerCase() === itemLower);
      if (match) {
        allocatedUsers.push(`${u.name} (×${match.quantity || 1})`);
        totalQty += (match.quantity || 1);
      }
    }

    return {
      "S.No.": index + 1,
      "Item Name": item.name,
      "Total In Circulation": totalQty,
      "Assigned To Users": allocatedUsers.length > 0 ? allocatedUsers.join("; ") : "Available / Unassigned",
    };
  });

  const wb = XLSX.utils.book_new();

  // Create worksheets
  const wsDetailed = XLSX.utils.json_to_sheet(detailedRows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsCatalog = XLSX.utils.json_to_sheet(catalogRows);

  // Set explicit column widths for clean readability in Excel
  wsDetailed["!cols"] = [
    { wch: 8 },  // S.No.
    { wch: 28 }, // User Name
    { wch: 26 }, // Item Name
    { wch: 12 }, // Quantity
    { wch: 20 }, // Status
  ];

  wsSummary["!cols"] = [
    { wch: 8 },  // S.No.
    { wch: 28 }, // User Name
    { wch: 22 }, // Total Items Allocated
    { wch: 18 }, // Unique Items Count
    { wch: 60 }, // Allocated Items Summary
  ];

  wsCatalog["!cols"] = [
    { wch: 8 },  // S.No.
    { wch: 26 }, // Item Name
    { wch: 20 }, // Total In Circulation
    { wch: 65 }, // Assigned To Users
  ];

  XLSX.utils.book_append_sheet(wb, wsDetailed, "All Allocations");
  XLSX.utils.book_append_sheet(wb, wsSummary, "User Summary");
  XLSX.utils.book_append_sheet(wb, wsCatalog, "Catalog In-Use");

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const filename = `Inventory_Report_${dateStr}_${hours}${mins}.xlsx`;

  XLSX.writeFile(wb, filename);
}
