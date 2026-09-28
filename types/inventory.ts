export interface UserAssignment {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface InventoryUser {
  id: string;
  name: string;
  assignments: UserAssignment[];
}

export interface CatalogItem {
  id: string;
  name: string;
}
