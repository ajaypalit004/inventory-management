"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, X, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { UserRow } from "@/components/UserRow";
import { AssignItemModal } from "@/components/AssignItemModal";
import { UserDetailModal } from "@/components/UserDetailModal";
import { AddUserModal } from "@/components/AddUserModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CatalogItem, InventoryUser, UserAssignment } from "@/types/inventory";
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

  // Search Bar (No filters)
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [detailUser, setDetailUser] = useState<InventoryUser | null>(null);
  const [assignUser, setAssignUser] = useState<InventoryUser | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // In-website confirmation modal state (replaces Chrome confirm)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Notification toast
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification((curr) => (curr === message ? null : curr));
    }, 3000);
  };

  // Load from localStorage
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    const loadedCatalog = getStoredCatalog();
    setUsers(loadedUsers);
    setCatalog(loadedCatalog);
    setIsLoaded(true);
  }, []);

  // Save changes
  useEffect(() => {
    if (isLoaded) {
      saveStoredUsers(users);
    }
  }, [users, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveStoredCatalog(catalog);
    }
  }, [catalog, isLoaded]);

  // Keep detailUser synced with latest user data
  useEffect(() => {
    if (detailUser) {
      const updated = users.find((u) => u.id === detailUser.id);
      if (updated) {
        setDetailUser(updated);
      }
    }
  }, [users, detailUser]);

  // Instant Search by user name or assigned item name
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      if (u.name.toLowerCase().includes(q)) return true;
      const hasItem = u.assignments.some((a) =>
        a.itemName.toLowerCase().includes(q)
      );
      return hasItem;
    });
  }, [users, searchQuery]);

  const totalAssignedCount = useMemo(() => {
    return users.reduce((acc, user) => acc + user.assignments.length, 0);
  }, [users]);

  // Assign item to user (adds to catalog if new)
  const handleAssignItem = (userId: string, itemName: string) => {
    const trimmed = itemName.trim();
    if (!trimmed) return;

    // Check if item exists in catalog, otherwise add it
    let catalogItem = catalog.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (!catalogItem) {
      catalogItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        name: trimmed,
      };
      setCatalog((prev) => [catalogItem!, ...prev]);
    }

    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id !== userId) return u;

        // Check if user already has this item
        const exists = u.assignments.some(
          (a) => a.itemName.toLowerCase() === trimmed.toLowerCase()
        );

        if (exists) {
          return u;
        }

        const newAssignment: UserAssignment = {
          id: `asg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          itemId: catalogItem!.id,
          itemName: catalogItem!.name,
        };

        return {
          ...u,
          assignments: [...u.assignments, newAssignment],
        };
      })
    );

    const targetUser = users.find((u) => u.id === userId);
    showToast(`Added ${catalogItem.name} to ${targetUser?.name || "user"}`);
  };

  // Request full remove via trash icon with in-website confirmation
  const handleRequestRemove = (userId: string, assignment: UserAssignment) => {
    const targetUser = users.find((u) => u.id === userId);
    setConfirmState({
      isOpen: true,
      title: "Remove Item",
      message: `Remove "${assignment.itemName}" from ${targetUser?.name || "user"}?`,
      onConfirm: () => {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              assignments: u.assignments.filter((a) => a.id !== assignment.id),
            };
          })
        );
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast(`Removed ${assignment.itemName}`);
      },
    });
  };

  // Add User
  const handleAddUser = (newUserData: Omit<InventoryUser, "id" | "assignments">) => {
    const newUser: InventoryUser = {
      ...newUserData,
      id: `user-${Date.now()}`,
      assignments: [],
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast(`Added ${newUser.name}`);
  };

  // Reset Data (with in-website confirmation modal)
  const handleRequestReset = () => {
    setConfirmState({
      isOpen: true,
      title: "Reset Inventory",
      message: "Reset all users and assignments to default state?",
      onConfirm: () => {
        const reset = resetAllData();
        setUsers(reset.users);
        setCatalog(reset.catalog);
        setDetailUser(null);
        setAssignUser(null);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast("Reset to default data");
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-70 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        userCount={users.length}
        totalAssigned={totalAssignedCount}
        onOpenAddUser={() => setIsAddUserOpen(true)}
        onResetData={handleRequestReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Search Bar (No filters) */}
        <div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
            <input
              type="text"
              placeholder="Search user or assigned item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-base rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs hover:border-slate-300 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Linear Format User Rows List */}
        <div className="space-y-2.5">
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">
                No users found matching &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onSelectUser={(u) => setDetailUser(u)}
                onAssignItem={(u) => setAssignUser(u)}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Inventory Desk • Minimal Blue &amp; White
      </footer>

      {/* In-Website Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Assign Item Modal */}
      <AssignItemModal
        isOpen={Boolean(assignUser)}
        onClose={() => setAssignUser(null)}
        user={assignUser}
        catalog={catalog}
        onAssignItem={handleAssignItem}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        user={detailUser}
        isOpen={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        onOpenAssignModal={(u) => {
          setAssignUser(u);
        }}
        onRequestRemove={handleRequestRemove}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddUser={handleAddUser}
      />
    </div>
  );
}
