import { CatalogItem, InventoryUser } from "@/types/inventory";

export const INITIAL_CATALOG: CatalogItem[] = [];

export const INITIAL_USERS: InventoryUser[] = [
  {
    id: "user-1",
    name: "Sarah Jenkins",
    assignments: [
      { id: "asg-1", itemId: "item-1", itemName: "MacBook Pro" },
      { id: "asg-2", itemId: "item-2", itemName: "Dell Monitor" },
      { id: "asg-3", itemId: "item-3", itemName: "Wireless Mouse" },
    ],
  },
  {
    id: "user-2",
    name: "Alex Rivera",
    assignments: [
      { id: "asg-4", itemId: "item-1", itemName: "MacBook Pro" },
      { id: "asg-5", itemId: "item-4", itemName: "iPad Pro" },
    ],
  },
  {
    id: "user-3",
    name: "Michael Chen",
    assignments: [
      { id: "asg-6", itemId: "item-5", itemName: "ThinkPad Laptop" },
      { id: "asg-7", itemId: "item-6", itemName: "Ultrawide Monitor" },
      { id: "asg-8", itemId: "item-7", itemName: "Security Key" },
    ],
  },
  {
    id: "user-4",
    name: "Priya Sharma",
    assignments: [
      { id: "asg-9", itemId: "item-8", itemName: "MacBook Air" },
      { id: "asg-10", itemId: "item-9", itemName: "Wireless Headset" },
    ],
  },
  {
    id: "user-5",
    name: "David Kim",
    assignments: [
      { id: "asg-11", itemId: "item-1", itemName: "MacBook Pro" },
      { id: "asg-12", itemId: "item-10", itemName: "Docking Station" },
    ],
  },
  {
    id: "user-6",
    name: "Emily Watson",
    assignments: [
      { id: "asg-13", itemId: "item-8", itemName: "MacBook Air" },
      { id: "asg-14", itemId: "item-11", itemName: "Noise Cancelling Headphones" },
    ],
  },
  {
    id: "user-7",
    name: "Robert Patel",
    assignments: [
      { id: "asg-15", itemId: "item-5", itemName: "ThinkPad Laptop" },
      { id: "asg-16", itemId: "item-2", itemName: "Dell Monitor" },
    ],
  },
  {
    id: "user-8",
    name: "Jessica Taylor",
    assignments: [
      { id: "asg-17", itemId: "item-8", itemName: "MacBook Air" },
    ],
  },
  {
    id: "user-9",
    name: "Marcus Vance",
    assignments: [
      { id: "asg-18", itemId: "item-1", itemName: "MacBook Pro" },
      { id: "asg-19", itemId: "item-12", itemName: "Test Phone" },
    ],
  },
  {
    id: "user-10",
    name: "Elena Rostova",
    assignments: [],
  },
];
