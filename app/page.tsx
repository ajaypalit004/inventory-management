"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Plus,
  Users,
  Package,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { UserCard } from "@/components/UserCard";
import { AssignItemModal } from "@/components/AssignItemModal";
import { UserDetailModal } from "@/components/UserDetailModal";
import { CatalogModal } from "@/components/CatalogModal";
import { AddUserModal } from "@/components/AddUserModal";
import { CatalogItem, InventoryUser, ItemCategory } from "@/types/inventory";
import { INITIAL_CATALOG, INITIAL_USERS } from "@/lib/initialData";
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredCatalog,
  saveStoredCatalog,
  resetAllData,
} from "@/lib/storage";

export default function HomePage() {
  const [users, setUsers] = useState<InventoryUser[]>(INITIAL_USERS);
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL_CATALOG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  // Modals state
  const [detailUser, setDetailUser] = useState<InventoryUser | null>(null);
  const [assignUser, setAssignUser] = useState<InventoryUser | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Notification toast
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification((curr) => (curr === message ? null : curr));
    }, 4000);
  };

  // Load initial data from localStorage on mount
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    const loadedCatalog = getStoredCatalog();
    setUsers(loadedUsers);
    setCatalog(loadedCatalog);
    setIsLoaded(true);
  }, []);

  // Sync users to storage
  useEffect(() => {
    if (isLoaded) {
      saveStoredUsers(users);
    }
  }, [users, isLoaded]);

  // Sync catalog to storage
  useEffect(() => {
    if (isLoaded) {
      saveStoredCatalog(catalog);
    }
  }, [catalog, isLoaded]);

  // Extract all distinct departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    users.forEach((u) => depts.add(u.department));
    return ["All", ...Array.from(depts)];
  }, [users]);

  // Filtered users based on search bar & department
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchDept = selectedDept === "All" || u.department === selectedDept;
      if (!matchDept) return false;

      if (!query) return true;

      // Match name
      if (u.name.toLowerCase().includes(query)) return true;
      // Match department or role
      if (u.department.toLowerCase().includes(query)) return true;
      if (u.role.toLowerCase().includes(query)) return true;
      if (u.email.toLowerCase().includes(query)) return true;
      // Match any assigned equipment name
      const matchItem = u.assignments.some(
        (asg) =>
          asg.itemName.toLowerCase().includes(query) ||
          asg.category.toLowerCase().includes(query) ||
          (asg.serialNumber && asg.serialNumber.toLowerCase().includes(query))
      );
      return matchItem;
    });
  }, [users, searchQuery, selectedDept]);

  // Stats calculation
  const totalAssignedCount = useMemo(() => {
    return users.reduce(
      (acc, user) =>
        acc + user.assignments.reduce((sum, a) => sum + (a.quantity || 1), 0),
      0
    );
  }, [users]);

  // Handlers for assignments
  const handleAssignExistingItem = (
    userId: string,
    item: CatalogItem,
    quantity: number,
    serialNumber?: string,
    notes?: string
  ) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id !== userId) return u;

        const newAssignment = {
          id: `asg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          serialNumber,
          quantity,
          assignedDate: new Date().toISOString().split("T")[0],
          notes,
        };

        const updated = {
          ...u,
          assignments: [newAssignment, ...u.assignments],
        };

        // Update detailUser if currently open
        if (detailUser && detailUser.id === userId) {
          setDetailUser(updated);
        }

        return updated;
      })
    );

    const targetUser = users.find((u) => u.id === userId);
    showToast(`Assigned ${item.name} (x${quantity}) to ${targetUser?.name || "user"}`);
  };

  const handleAddNewAndAssign = (
    userId: string,
    newItemData: {
      name: string;
      category: ItemCategory;
      model?: string;
      description?: string;
      quantity: number;
      serialNumber?: string;
      notes?: string;
    }
  ) => {
    // 1. Create and add to catalog so it is permanently saved in listed items
    const newItemId = `item-${Date.now()}`;
    const newCatalogEntry: CatalogItem = {
      id: newItemId,
      name: newItemData.name,
      category: newItemData.category,
      model: newItemData.model,
      description: newItemData.description,
      totalStock: 10,
      createdAt: new Date().toISOString(),
    };

    setCatalog((prev) => [newCatalogEntry, ...prev]);

    // 2. Assign to user
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id !== userId) return u;

        const newAssignment = {
          id: `asg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          itemId: newItemId,
          itemName: newItemData.name,
          category: newItemData.category,
          serialNumber: newItemData.serialNumber,
          quantity: newItemData.quantity,
          assignedDate: new Date().toISOString().split("T")[0],
          notes: newItemData.notes,
        };

        const updated = {
          ...u,
          assignments: [newAssignment, ...u.assignments],
        };

        if (detailUser && detailUser.id === userId) {
          setDetailUser(updated);
        }

        return updated;
      })
    );

    const targetUser = users.find((u) => u.id === userId);
    showToast(
      `Added "${newItemData.name}" to Master Listed Items & assigned to ${
        targetUser?.name || "user"
      }`
    );
  };

  const handleUnassignItem = (userId: string, assignmentId: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id !== userId) return u;
        const updated = {
          ...u,
          assignments: u.assignments.filter((a) => a.id !== assignmentId),
        };
        if (detailUser && detailUser.id === userId) {
          setDetailUser(updated);
        }
        return updated;
      })
    );
    showToast("Item unassigned and returned to inventory stock");
  };

  const handleAddUser = (
    newUserData: Omit<InventoryUser, "id" | "assignments" | "joinedDate">
  ) => {
    const newUser: InventoryUser = {
      ...newUserData,
      id: `user-${Date.now()}`,
      joinedDate: new Date().toISOString().split("T")[0],
      assignments: [],
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast(`Added ${newUser.name} to inventory team`);
  };

  const handleAddCatalogItem = (newItemData: {
    name: string;
    category: ItemCategory;
    model?: string;
    description?: string;
    totalStock?: number;
  }) => {
    const newItem: CatalogItem = {
      ...newItemData,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCatalog((prev) => [newItem, ...prev]);
    showToast(`"${newItem.name}" added to master listed items catalog`);
  };

  const handleReset = () => {
    const reset = resetAllData();
    setUsers(reset.users);
    setCatalog(reset.catalog);
    setDetailUser(null);
    setAssignUser(null);
    showToast("Reset all records to default sample data");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Top Minimal Navbar */}
      <Navbar
        catalogCount={catalog.length}
        userCount={users.length}
        totalAssigned={totalAssignedCount}
        onOpenAddUser={() => setIsAddUserOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onResetData={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top Search Bar & Filters Section */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Primary Search Bar */}
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
                <input
                  type="text"
                  placeholder="Search user by name, department, role, or assigned items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 hover:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Department Filter Pills or Dropdown */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
                <span className="text-slate-400 font-medium hidden md:inline-flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium text-xs transition-colors ${
                      selectedDept === dept
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Counter Info */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <p>
              Showing{" "}
              <strong className="text-slate-800 font-semibold">
                {filteredUsers.length}
              </strong>{" "}
              of {users.length} team members
              {searchQuery && (
                <span>
                  {" "}
                  matching &quot;
                  <span className="text-blue-600 font-medium">
                    {searchQuery}
                  </span>
                  &quot;
                </span>
              )}
            </p>

            <span className="text-slate-400">
              Click any user for details or click <strong>&apos;+&apos;</strong> to assign
            </span>
          </div>
        </div>

        {/* User Cards Grid / List */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto mt-8">
            <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900">
              No matching users found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              We couldn&apos;t find any user matching your search query &quot;{searchQuery}&quot;.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDept("All");
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
              >
                + Add New User
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onSelectUser={(u) => setDetailUser(u)}
                onAssignItem={(u) => setAssignUser(u)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer Note */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-500">
            Inventory Desk • Minimal Blue & White Asset Management
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Client & Cloud Synchronized</span>
            <span>•</span>
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="text-blue-600 hover:underline"
            >
              Browse Catalog ({catalog.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Assign Item Modal (triggered from '+' button on homepage or from details modal) */}
      <AssignItemModal
        isOpen={Boolean(assignUser)}
        onClose={() => setAssignUser(null)}
        user={assignUser}
        catalog={catalog}
        onAssignExistingItem={handleAssignExistingItem}
        onAddNewAndAssign={handleAddNewAndAssign}
      />

      {/* 2. User Detail Modal (triggered when clicking any user) */}
      <UserDetailModal
        user={detailUser}
        isOpen={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        onOpenAssignModal={(u) => {
          setAssignUser(u);
        }}
        onUnassignItem={handleUnassignItem}
      />

      {/* 3. Master Catalog Modal */}
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        catalog={catalog}
        users={users}
        onAddCatalogItem={handleAddCatalogItem}
      />

      {/* 4. Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddUser={handleAddUser}
      />
    </div>
  );
}
