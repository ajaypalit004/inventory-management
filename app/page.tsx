"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Navbar, SyncStatus } from "@/components/Navbar";
import { UserRow } from "@/components/UserRow";
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  // Search Bar (No filters)
  const [searchQuery, setSearchQuery] = useState("");

  // Selected User Modal
  const [activeUser, setActiveUser] = useState<InventoryUser | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // In-website confirmation modal state (replaces Chrome alert)
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

  // Tracking refs for multi-device sync
  const lastLocalEditTimestamp = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCloudInitialized = useRef<boolean>(false);
  const activeUserIdRef = useRef<string | null>(null);
  activeUserIdRef.current = activeUser ? activeUser.id : null;

  // Cloud Save Helper (Debounced)
  const scheduleCloudSync = useCallback(
    (newUsers: InventoryUser[], newCatalog: CatalogItem[]) => {
      lastLocalEditTimestamp.current = Date.now();
      setSyncStatus("syncing");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ users: newUsers, catalog: newCatalog }),
          });
          if (!res.ok) {
            throw new Error(`Cloud save failed: ${res.status}`);
          }
          setSyncStatus("synced");
        } catch (err) {
          console.error("Cloud synchronization error:", err);
          setSyncStatus("error");
        }
      }, 500);
    },
    []
  );

  // Cloud Fetch Helper (Pulls updates made from any other device)
  const pullCloudData = useCallback(async (silent = false) => {
    // If the user has made an edit in the last 2 seconds, avoid overwriting
    if (Date.now() - lastLocalEditTimestamp.current < 2500) {
      return;
    }

    if (!silent) setSyncStatus("syncing");

    try {
      const res = await fetch(`/api/inventory?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data.users)) {
        setUsers((currentUsers) => {
          // Compare JSON to avoid re-rendering if identical
          if (JSON.stringify(currentUsers) !== JSON.stringify(data.users)) {
            saveStoredUsers(data.users);
            return data.users;
          }
          return currentUsers;
        });
      }

      if (Array.isArray(data.catalog)) {
        setCatalog((currentCatalog) => {
          if (JSON.stringify(currentCatalog) !== JSON.stringify(data.catalog)) {
            saveStoredCatalog(data.catalog);
            return data.catalog;
          }
          return currentCatalog;
        });
      }

      setSyncStatus("synced");
    } catch (err) {
      console.warn("Could not sync with cloud server:", err);
      if (!silent) setSyncStatus("offline");
    }
  }, []);

  // 1. Initial Load: Load fast from local cache first, then sync immediately with cloud
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    const loadedCatalog = getStoredCatalog();
    setUsers(loadedUsers);
    setCatalog(loadedCatalog);
    setIsLoaded(true);

    // Initial cloud fetch
    pullCloudData(false).then(() => {
      isCloudInitialized.current = true;
    });
  }, [pullCloudData]);

  // 2. Multi-device live sync: periodic polling every 5 seconds + on window focus/tab change
  useEffect(() => {
    const handleFocus = () => {
      pullCloudData(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pullCloudData(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Light periodic polling to keep all open devices in sync automatically
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        pullCloudData(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, [pullCloudData]);

  // Keep activeUser synced with latest user data (including when multi-device update arrives)
  useEffect(() => {
    if (activeUserIdRef.current) {
      const updated = users.find((u) => u.id === activeUserIdRef.current);
      if (updated) {
        setActiveUser(updated);
      }
    }
  }, [users]);

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
    return users.reduce(
      (acc, user) =>
        acc + user.assignments.reduce((sum, a) => sum + (a.quantity || 1), 0),
      0
    );
  }, [users]);

  // Assign item to user (adds to catalog if new)
  const handleAssignItem = (userId: string, itemName: string) => {
    const trimmed = itemName.trim();
    if (!trimmed) return;

    let updatedCatalog = catalog;
    let catalogItem = catalog.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (!catalogItem) {
      catalogItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        name: trimmed,
      };
      updatedCatalog = [catalogItem, ...catalog];
      setCatalog(updatedCatalog);
      saveStoredCatalog(updatedCatalog);
    }

    const updatedUsers = users.map((u) => {
      if (u.id !== userId) return u;

      const existingIndex = u.assignments.findIndex(
        (a) => a.itemName.toLowerCase() === trimmed.toLowerCase()
      );

      if (existingIndex > -1) {
        const nextAssignments = [...u.assignments];
        nextAssignments[existingIndex] = {
          ...nextAssignments[existingIndex],
          quantity: (nextAssignments[existingIndex].quantity || 1) + 1,
        };
        return { ...u, assignments: nextAssignments };
      }

      const newAssignment: UserAssignment = {
        id: `assign-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        itemId: catalogItem!.id,
        itemName: catalogItem!.name,
        quantity: 1,
      };

      return {
        ...u,
        assignments: [newAssignment, ...u.assignments],
      };
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    scheduleCloudSync(updatedUsers, updatedCatalog);
    showToast(`Assigned ${catalogItem.name}`);
  };

  // Increase quantity
  const handleIncreaseQuantity = (userId: string, assignmentId: string) => {
    const updatedUsers = users.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        assignments: u.assignments.map((a) =>
          a.id === assignmentId ? { ...a, quantity: (a.quantity || 1) + 1 } : a
        ),
      };
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    scheduleCloudSync(updatedUsers, catalog);
  };

  // Decrease quantity
  const handleDecreaseQuantity = (
    userId: string,
    assignment: UserAssignment
  ) => {
    if ((assignment.quantity || 1) <= 1) {
      handleRequestRemove(userId, assignment);
      return;
    }

    const updatedUsers = users.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        assignments: u.assignments.map((a) =>
          a.id === assignment.id
            ? { ...a, quantity: Math.max(1, (a.quantity || 1) - 1) }
            : a
        ),
      };
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    scheduleCloudSync(updatedUsers, catalog);
  };

  // Remove assignment with in-website confirmation modal
  const handleRequestRemove = (userId: string, assignment: UserAssignment) => {
    setConfirmState({
      isOpen: true,
      title: "Remove Assignment",
      message: `Remove "${assignment.itemName}" from this user?`,
      onConfirm: () => {
        const updatedUsers = users.map((u) => {
          if (u.id !== userId) return u;
          return {
            ...u,
            assignments: u.assignments.filter((a) => a.id !== assignment.id),
          };
        });

        setUsers(updatedUsers);
        saveStoredUsers(updatedUsers);
        scheduleCloudSync(updatedUsers, catalog);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast(`Removed ${assignment.itemName}`);
      },
    });
  };

  // Delete User with in-website confirmation
  const handleRequestDeleteUser = (user: InventoryUser) => {
    setConfirmState({
      isOpen: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${user.name}"? This will remove the user and all their assignments.`,
      onConfirm: () => {
        const updatedUsers = users.filter((u) => u.id !== user.id);
        setUsers(updatedUsers);
        saveStoredUsers(updatedUsers);
        scheduleCloudSync(updatedUsers, catalog);
        setActiveUser(null);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast(`Deleted ${user.name}`);
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
    const updatedUsers = [newUser, ...users];
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    scheduleCloudSync(updatedUsers, catalog);
    showToast(`Added ${newUser.name}`);
  };

  // Reset Data (with in-website confirmation modal)
  const handleRequestReset = () => {
    setConfirmState({
      isOpen: true,
      title: "Reset Inventory",
      message: "Reset all users and assignments to default state on all devices?",
      onConfirm: () => {
        const reset = resetAllData();
        setUsers(reset.users);
        setCatalog(reset.catalog);
        setActiveUser(null);
        scheduleCloudSync(reset.users, reset.catalog);
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
        syncStatus={syncStatus}
        onOpenAddUser={() => setIsAddUserOpen(true)}
        onResetData={handleRequestReset}
        onManualRefresh={() => {
          pullCloudData(false);
          showToast("Syncing latest data...");
        }}
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
                onSelectUser={(u) => setActiveUser(u)}
                onAssignItem={(u) => setActiveUser(u)}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Inventory Desk • Cloud Synced on All Devices • Minimal Blue &amp; White
      </footer>

      {/* User Detail / Manage Items Modal */}
      <UserDetailModal
        user={activeUser}
        isOpen={Boolean(activeUser)}
        onClose={() => setActiveUser(null)}
        catalog={catalog}
        onAssignItem={handleAssignItem}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
        onRequestRemove={handleRequestRemove}
        onRequestDeleteUser={handleRequestDeleteUser}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddUser={handleAddUser}
      />

      {/* In-Website Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
