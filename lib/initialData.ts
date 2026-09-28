import { CatalogItem, InventoryUser } from "@/types/inventory";

export const INITIAL_CATALOG: CatalogItem[] = [];

export const USER_NAMES: string[] = [
  "Khushboo Jain",
  "Mihika jain",
  "Ayushi Sharma",
  "Aman Soori",
  "Achal Jain",
  "Aditya Soni",
  "Akhilesh sharma",
  "Akshay",
  "Amit gautam",
  "Anil yadav",
  "Ankit khandelwal",
  "Ashish khar",
  "Ashish tak",
  "Ashu khandelwal",
  "Atul yadav",
  "Bhupendra sharma",
  "Deepak janyani",
  "Dipesh Dhundhara",
  "Gaurav Kumar",
  "Gopal Singh",
  "Hanuman berwa",
  "Hemlata bhardwaz",
  "Joy biswas",
  "Lata",
  "Laxmikant",
  "lokesh gupta",
  "Mohan shyam",
  "Nakul kheer",
  "padma vikram",
  "Pavan kumar",
  "Praveen soni",
  "Puneet sharma",
  "Rajendra sheoran",
  "Rakesh kumar",
];

export const INITIAL_USERS: InventoryUser[] = USER_NAMES.map((name, index) => ({
  id: `user-${index + 1}`,
  name,
  assignments: [],
}));
