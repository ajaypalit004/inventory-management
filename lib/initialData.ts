import { CatalogItem, InventoryUser } from "@/types/inventory";

export const INITIAL_CATALOG: CatalogItem[] = [];

export const USER_NAMES: string[] = [
  "ajaypal singh shekhawat",
  "ravikant koli",
  "bhavika choudhary",
  "ramakrishna pandey",
  "Ayushi Sharma",
  "Aditya Soni",
  "Akhilesh sharma",
  "Anil yadav",
  "Ashish khar",
  "Ashu khandelwal",
  "Deepak janyani",
  "Dipesh Dhundhara",
  "Gopal Singh",
  "Hanuman berwa",
  "Joy biswas",
  "Lata",
  "Mohan shyam",
  "padma vikram",
  "Pavan kumar",
];

export const INITIAL_USERS: InventoryUser[] = USER_NAMES.map((name, index) => ({
  id: `user-${index + 1}`,
  name,
  assignments: [],
}));
