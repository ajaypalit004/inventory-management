export type ItemCategory = 
  | 'Computers & Laptops'
  | 'Displays & Monitors'
  | 'Peripherals & Input'
  | 'Mobile & Tablets'
  | 'Audio & Communication'
  | 'Desk & Furniture'
  | 'Network & Hardware'
  | 'Accessories & Other';

export interface CatalogItem {
  id: string;
  name: string;
  category: ItemCategory;
  model?: string;
  description?: string;
  totalStock?: number;
  createdAt: string;
}

export interface UserAssignment {
  id: string;
  itemId: string;
  itemName: string;
  category: ItemCategory;
  serialNumber?: string;
  quantity: number;
  assignedDate: string;
  notes?: string;
}

export interface InventoryUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatarBg?: string;
  joinedDate: string;
  assignments: UserAssignment[];
}
