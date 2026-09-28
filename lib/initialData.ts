import { CatalogItem, InventoryUser } from "@/types/inventory";

export const INITIAL_CATALOG: CatalogItem[] = [
  {
    id: "item-1",
    name: "MacBook Pro 16\" M3 Max",
    category: "Computers & Laptops",
    model: "Apple M3 Max / 36GB / 1TB SSD",
    description: "High performance workstation laptop for engineers and designers",
    totalStock: 12,
    createdAt: "2026-01-10T10:00:00Z"
  },
  {
    id: "item-2",
    name: "MacBook Air 15\" M3",
    category: "Computers & Laptops",
    model: "Apple M3 / 16GB / 512GB SSD",
    description: "Lightweight and powerful laptop for operations and management",
    totalStock: 15,
    createdAt: "2026-01-12T10:00:00Z"
  },
  {
    id: "item-3",
    name: "ThinkPad X1 Carbon Gen 11",
    category: "Computers & Laptops",
    model: "Intel Core i7 / 32GB / 1TB SSD",
    description: "Enterprise ultrabook with tactile keyboard and military spec build",
    totalStock: 8,
    createdAt: "2026-01-15T10:00:00Z"
  },
  {
    id: "item-4",
    name: "Dell UltraSharp 27\" 4K (U2723QE)",
    category: "Displays & Monitors",
    model: "4K IPS Black, USB-C 90W Hub",
    description: "Crisp color accurate display with integrated docking",
    totalStock: 20,
    createdAt: "2026-01-16T10:00:00Z"
  },
  {
    id: "item-5",
    name: "Apple Studio Display 27\"",
    category: "Displays & Monitors",
    model: "5K Retina Display with tilt stand",
    description: "5K retina studio monitor with 12MP camera & spatial audio",
    totalStock: 6,
    createdAt: "2026-01-18T10:00:00Z"
  },
  {
    id: "item-6",
    name: "LG 34\" Curved Ultrawide (34WN80C)",
    category: "Displays & Monitors",
    model: "WQHD 3440x1440 USB-C IPS",
    description: "Immersive curved panoramic monitor for multitasking",
    totalStock: 10,
    createdAt: "2026-01-20T10:00:00Z"
  },
  {
    id: "item-7",
    name: "Logitech MX Master 3S Mouse",
    category: "Peripherals & Input",
    model: "Quiet Click, 8K DPI Darkfield",
    description: "Ergonomic wireless mouse with electromagnetic MagSpeed wheel",
    totalStock: 30,
    createdAt: "2026-01-22T10:00:00Z"
  },
  {
    id: "item-8",
    name: "Keychron K2 Pro Mechanical Keyboard",
    category: "Peripherals & Input",
    model: "Wireless QMK/VIA Custom Gateron Red",
    description: "75% layout wireless mechanical keyboard with PBT keycaps",
    totalStock: 25,
    createdAt: "2026-01-22T10:00:00Z"
  },
  {
    id: "item-9",
    name: "Apple Magic Trackpad 3",
    category: "Peripherals & Input",
    model: "Force Touch Multi-Touch Surface",
    description: "Smooth multi-touch gestures and force click support",
    totalStock: 14,
    createdAt: "2026-01-23T10:00:00Z"
  },
  {
    id: "item-10",
    name: "iPad Pro 12.9\" M2 + Apple Pencil",
    category: "Mobile & Tablets",
    model: "Liquid Retina XDR, 256GB Wi-Fi",
    description: "Tablet for UI/UX sketching, wireframing and testing",
    totalStock: 7,
    createdAt: "2026-01-25T10:00:00Z"
  },
  {
    id: "item-11",
    name: "iPhone 15 Pro (Test Device)",
    category: "Mobile & Tablets",
    model: "A17 Pro, 128GB Blue Titanium",
    description: "Dedicated mobile QA test and validation handset",
    totalStock: 5,
    createdAt: "2026-01-26T10:00:00Z"
  },
  {
    id: "item-12",
    name: "Sony WH-1000XM5 Noise-Cancelling Headphones",
    category: "Audio & Communication",
    model: "Industry-leading ANC, 30hr battery",
    description: "Over-ear noise cancelling headphones for deep focus",
    totalStock: 16,
    createdAt: "2026-01-27T10:00:00Z"
  },
  {
    id: "item-13",
    name: "Jabra Evolve2 65 Headset",
    category: "Audio & Communication",
    model: "Dual-ear Wireless UC Stereo with boom mic",
    description: "Professional call headset with busy light indicator",
    totalStock: 18,
    createdAt: "2026-01-28T10:00:00Z"
  },
  {
    id: "item-14",
    name: "CalDigit TS4 Thunderbolt 4 Dock",
    category: "Network & Hardware",
    model: "18 Ports, 98W Power Delivery",
    description: "Universal workstation dock with high-speed peripheral support",
    totalStock: 12,
    createdAt: "2026-02-01T10:00:00Z"
  },
  {
    id: "item-15",
    name: "YubiKey 5C NFC Security Key",
    category: "Network & Hardware",
    model: "FIDO2 / U2F / WebAuthn Hardware Token",
    description: "Hardware 2FA authentication token for zero-trust compliance",
    totalStock: 50,
    createdAt: "2026-02-02T10:00:00Z"
  },
  {
    id: "item-16",
    name: "Herman Miller Aeron Ergonomic Chair",
    category: "Desk & Furniture",
    model: "Size B, Fully Adjustable Arms, PostureFit SL",
    description: "Premier ergonomic office chair for spinal support",
    totalStock: 15,
    createdAt: "2026-02-03T10:00:00Z"
  },
  {
    id: "item-17",
    name: "Ergotron LX Dual Monitor Arm",
    category: "Desk & Furniture",
    model: "Polished Aluminum Heavy-Duty Gas Spring",
    description: "Fully articulating dual display mounting arm",
    totalStock: 10,
    createdAt: "2026-02-04T10:00:00Z"
  }
];

export const INITIAL_USERS: InventoryUser[] = [
  {
    id: "user-1",
    name: "Sarah Jenkins",
    email: "sarah.j@company.com",
    department: "Engineering",
    role: "Lead Frontend Engineer",
    avatarBg: "bg-blue-600",
    joinedDate: "2024-03-15",
    assignments: [
      {
        id: "asg-101",
        itemId: "item-1",
        itemName: "MacBook Pro 16\" M3 Max",
        category: "Computers & Laptops",
        serialNumber: "C02XYZ8819A",
        quantity: 1,
        assignedDate: "2025-01-10",
        notes: "Primary engineering machine"
      },
      {
        id: "asg-102",
        itemId: "item-4",
        itemName: "Dell UltraSharp 27\" 4K (U2723QE)",
        category: "Displays & Monitors",
        serialNumber: "CN-098F21-7281",
        quantity: 1,
        assignedDate: "2025-01-10",
        notes: "Desk monitor #1"
      },
      {
        id: "asg-103",
        itemId: "item-7",
        itemName: "Logitech MX Master 3S Mouse",
        category: "Peripherals & Input",
        quantity: 1,
        assignedDate: "2025-01-10"
      },
      {
        id: "asg-104",
        itemId: "item-8",
        itemName: "Keychron K2 Pro Mechanical Keyboard",
        category: "Peripherals & Input",
        quantity: 1,
        assignedDate: "2025-01-12"
      }
    ]
  },
  {
    id: "user-2",
    name: "Alex Rivera",
    email: "alex.rivera@company.com",
    department: "Design",
    role: "Staff Product Designer",
    avatarBg: "bg-blue-500",
    joinedDate: "2024-06-01",
    assignments: [
      {
        id: "asg-201",
        itemId: "item-1",
        itemName: "MacBook Pro 16\" M3 Max",
        category: "Computers & Laptops",
        serialNumber: "C02DFP9920K",
        quantity: 1,
        assignedDate: "2025-02-01",
        notes: "Figma & 3D rendering setup"
      },
      {
        id: "asg-202",
        itemId: "item-5",
        itemName: "Apple Studio Display 27\"",
        category: "Displays & Monitors",
        serialNumber: "STU-5K-8812",
        quantity: 1,
        assignedDate: "2025-02-01"
      },
      {
        id: "asg-203",
        itemId: "item-10",
        itemName: "iPad Pro 12.9\" M2 + Apple Pencil",
        category: "Mobile & Tablets",
        serialNumber: "DMPQ7612AA",
        quantity: 1,
        assignedDate: "2025-02-15",
        notes: "For stylus sketches & visual review"
      }
    ]
  },
  {
    id: "user-3",
    name: "Michael Chen",
    email: "michael.c@company.com",
    department: "Engineering",
    role: "Backend Architect",
    avatarBg: "bg-indigo-600",
    joinedDate: "2023-11-20",
    assignments: [
      {
        id: "asg-301",
        itemId: "item-3",
        itemName: "ThinkPad X1 Carbon Gen 11",
        category: "Computers & Laptops",
        serialNumber: "L3-THINK-99120",
        quantity: 1,
        assignedDate: "2024-12-01",
        notes: "Linux Fedora work environment"
      },
      {
        id: "asg-302",
        itemId: "item-6",
        itemName: "LG 34\" Curved Ultrawide (34WN80C)",
        category: "Displays & Monitors",
        serialNumber: "LG-UW34-0012",
        quantity: 1,
        assignedDate: "2024-12-01"
      },
      {
        id: "asg-303",
        itemId: "item-15",
        itemName: "YubiKey 5C NFC Security Key",
        category: "Network & Hardware",
        quantity: 2,
        assignedDate: "2024-12-05",
        notes: "Primary & backup keys for AWS infra access"
      }
    ]
  },
  {
    id: "user-4",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    department: "People & HR",
    role: "People Operations Manager",
    avatarBg: "bg-sky-600",
    joinedDate: "2024-01-15",
    assignments: [
      {
        id: "asg-401",
        itemId: "item-2",
        itemName: "MacBook Air 15\" M3",
        category: "Computers & Laptops",
        serialNumber: "C02AIR15-9921",
        quantity: 1,
        assignedDate: "2025-01-20"
      },
      {
        id: "asg-402",
        itemId: "item-13",
        itemName: "Jabra Evolve2 65 Headset",
        category: "Audio & Communication",
        serialNumber: "JBR-EV2-4412",
        quantity: 1,
        assignedDate: "2025-01-20",
        notes: "For daily candidate interviews"
      }
    ]
  },
  {
    id: "user-5",
    name: "David Kim",
    email: "david.kim@company.com",
    department: "Infrastructure",
    role: "DevOps & Cloud Engineer",
    avatarBg: "bg-blue-700",
    joinedDate: "2024-04-10",
    assignments: [
      {
        id: "asg-501",
        itemId: "item-1",
        itemName: "MacBook Pro 16\" M3 Max",
        category: "Computers & Laptops",
        serialNumber: "C02M3MAX-7712",
        quantity: 1,
        assignedDate: "2025-03-01"
      },
      {
        id: "asg-502",
        itemId: "item-14",
        itemName: "CalDigit TS4 Thunderbolt 4 Dock",
        category: "Network & Hardware",
        serialNumber: "CD-TS4-99812",
        quantity: 1,
        assignedDate: "2025-03-01"
      },
      {
        id: "asg-503",
        itemId: "item-15",
        itemName: "YubiKey 5C NFC Security Key",
        category: "Network & Hardware",
        quantity: 1,
        assignedDate: "2025-03-01"
      }
    ]
  },
  {
    id: "user-6",
    name: "Emily Watson",
    email: "emily.w@company.com",
    department: "Marketing",
    role: "Brand & Content Strategist",
    avatarBg: "bg-blue-600",
    joinedDate: "2024-08-01",
    assignments: [
      {
        id: "asg-601",
        itemId: "item-2",
        itemName: "MacBook Air 15\" M3",
        category: "Computers & Laptops",
        serialNumber: "C02AIR15-3341",
        quantity: 1,
        assignedDate: "2025-02-10"
      },
      {
        id: "asg-602",
        itemId: "item-12",
        itemName: "Sony WH-1000XM5 Noise-Cancelling Headphones",
        category: "Audio & Communication",
        serialNumber: "SN-XM5-11029",
        quantity: 1,
        assignedDate: "2025-02-10"
      }
    ]
  },
  {
    id: "user-7",
    name: "Robert Patel",
    email: "robert.patel@company.com",
    department: "Finance",
    role: "Financial Controller",
    avatarBg: "bg-cyan-700",
    joinedDate: "2023-09-01",
    assignments: [
      {
        id: "asg-701",
        itemId: "item-3",
        itemName: "ThinkPad X1 Carbon Gen 11",
        category: "Computers & Laptops",
        serialNumber: "L3-THINK-44512",
        quantity: 1,
        assignedDate: "2024-10-15"
      },
      {
        id: "asg-702",
        itemId: "item-4",
        itemName: "Dell UltraSharp 27\" 4K (U2723QE)",
        category: "Displays & Monitors",
        serialNumber: "CN-098F21-9983",
        quantity: 2,
        assignedDate: "2024-10-15",
        notes: "Dual monitor setup for financial modeling"
      }
    ]
  },
  {
    id: "user-8",
    name: "Jessica Taylor",
    email: "jessica.t@company.com",
    department: "Customer Success",
    role: "Customer Operations Lead",
    avatarBg: "bg-blue-500",
    joinedDate: "2024-09-15",
    assignments: [
      {
        id: "asg-801",
        itemId: "item-2",
        itemName: "MacBook Air 15\" M3",
        category: "Computers & Laptops",
        serialNumber: "C02AIR15-7782",
        quantity: 1,
        assignedDate: "2025-01-05"
      },
      {
        id: "asg-802",
        itemId: "item-13",
        itemName: "Jabra Evolve2 65 Headset",
        category: "Audio & Communication",
        quantity: 1,
        assignedDate: "2025-01-05"
      }
    ]
  },
  {
    id: "user-9",
    name: "Marcus Vance",
    email: "marcus.v@company.com",
    department: "QA & Testing",
    role: "Senior QA Automation Engineer",
    avatarBg: "bg-indigo-700",
    joinedDate: "2024-05-12",
    assignments: [
      {
        id: "asg-901",
        itemId: "item-1",
        itemName: "MacBook Pro 16\" M3 Max",
        category: "Computers & Laptops",
        serialNumber: "C02M3MAX-1192",
        quantity: 1,
        assignedDate: "2025-02-18"
      },
      {
        id: "asg-902",
        itemId: "item-11",
        itemName: "iPhone 15 Pro (Test Device)",
        category: "Mobile & Tablets",
        serialNumber: "APL-IP15P-992",
        quantity: 1,
        assignedDate: "2025-02-18",
        notes: "For iOS mobile test suites"
      }
    ]
  },
  {
    id: "user-10",
    name: "Elena Rostova",
    email: "elena.r@company.com",
    department: "Analytics",
    role: "Data & BI Specialist",
    avatarBg: "bg-blue-800",
    joinedDate: "2024-07-22",
    assignments: [
      {
        id: "asg-1001",
        itemId: "item-1",
        itemName: "MacBook Pro 16\" M3 Max",
        category: "Computers & Laptops",
        serialNumber: "C02M3MAX-4510",
        quantity: 1,
        assignedDate: "2025-03-05"
      },
      {
        id: "asg-1002",
        itemId: "item-6",
        itemName: "LG 34\" Curved Ultrawide (34WN80C)",
        category: "Displays & Monitors",
        serialNumber: "LG-UW34-7718",
        quantity: 1,
        assignedDate: "2025-03-05"
      },
      {
        id: "asg-1003",
        itemId: "item-7",
        itemName: "Logitech MX Master 3S Mouse",
        category: "Peripherals & Input",
        quantity: 1,
        assignedDate: "2025-03-05"
      }
    ]
  },
  {
    id: "user-11",
    name: "Daniel O'Connor",
    email: "daniel.oc@company.com",
    department: "Engineering",
    role: "Junior Systems Engineer",
    avatarBg: "bg-sky-700",
    joinedDate: "2025-02-01",
    assignments: [
      {
        id: "asg-1101",
        itemId: "item-3",
        itemName: "ThinkPad X1 Carbon Gen 11",
        category: "Computers & Laptops",
        serialNumber: "L3-THINK-66129",
        quantity: 1,
        assignedDate: "2025-02-01"
      }
    ]
  },
  {
    id: "user-12",
    name: "Chloe Martin",
    email: "chloe.m@company.com",
    department: "Product",
    role: "Associate Product Manager",
    avatarBg: "bg-blue-600",
    joinedDate: "2025-03-10",
    assignments: []
  }
];
