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
import { InventoryAction } from "@/lib/cloudStorage";
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
  const liveUsersRef = useRef<InventoryUser[]>(INITIAL_USERS);
  const liveCatalogRef = useRef<CatalogItem[]>(INITIAL_CATALOG);

  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  // Search Bar (No filters)
  const [searchQuery, setSearchQuery] = useState("");

  // Selected User Modal - single source of truth is activeUserId
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const activeUser = useMemo(() => {
    if (!activeUserId) return null;
    return (
      liveUsersRef.current.find((u) => u.id === activeUserId) ||
      users.find((u) => u.id === activeUserId) ||
      null
    );
  }, [users, activeUserId]);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // In-website confirmation modal state (replaces Chrome alert)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
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

  // Tracking refs for multi-device sync and local operation serialization
  const lastLocalEditTimestamp = useRef<number>(0);
  const activeUserIdRef = useRef<string | null>(null);
  activeUserIdRef.current = activeUserId;

  // Track items intentionally deleted by local user within last 30s so server lag never re-adds them
  const deletedRecentlyRef = useRef<Map<string, number>>(new Map());

  // Helper for non-destructive local merge with incoming server data
  const mergeServerWithLocal = useCallback((serverUsers: InventoryUser[]): InventoryUser[] => {
    const now = Date.now();
    for (const [key, ts] of deletedRecentlyRef.current.entries()) {
      if (now - ts > 30000) deletedRecentlyRef.current.delete(key);
    }

    return serverUsers.map((serverUser) => {
      const localUser = liveUsersRef.current.find((u) => u.id === serverUser.id);
      if (!localUser) return serverUser;

      const serverItemNames = new Set(
        (serverUser.assignments || []).map((a) => a && a.itemName ? a.itemName.trim().toLowerCase() : "")
      );

      // Local assignments that the server response hasn't captured yet
      const unconfirmedLocal = (localUser.assignments || []).filter((la) => {
        if (!la || !la.itemName) return false;
        const lower = la.itemName.trim().toLowerCase();
        // If user explicitly deleted it recently, do not preserve it
        if (deletedRecentlyRef.current.has(lower)) return false;
        // If server already has it, no need to duplicate
        if (serverItemNames.has(lower)) return false;
        return true;
      });

      if (unconfirmedLocal.length === 0) return serverUser;

      return {
        ...serverUser,
        assignments: [...unconfirmedLocal, ...(serverUser.assignments || [])],
      };
    });
  }, []);

  // Sequential Atomic Batch Queue to guarantee 100% order of execution and zero lost updates
  const pendingActionsRef = useRef<InventoryAction[]>([]);
  const isDrainingRef = useRef<boolean>(false);

  const drainActionQueue = useCallback(async () => {
    if (isDrainingRef.current) return;
    if (pendingActionsRef.current.length === 0) return;

    isDrainingRef.current = true;
    setSyncStatus("syncing");

    while (pendingActionsRef.current.length > 0) {
      // Collect all actions currently queued as a single atomic batch
      const batch = pendingActionsRef.current.splice(0);

      try {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actions: batch }),
          keepalive: true,
        });

        if (!res.ok) {
          throw new Error(`Cloud batch failed with status ${res.status}`);
        }

        const data = await res.json();

        // Safe client update: preserve unconfirmed local assignments so fast additions never disappear
        if (Array.isArray(data.users)) {
          const merged = mergeServerWithLocal(data.users);
          liveUsersRef.current = merged;
          setUsers(merged);
          saveStoredUsers(merged);
        }
        if (Array.isArray(data.catalog)) {
          // Merge catalog cleanly
          const catMap = new Map<string, CatalogItem>();
          for (const c of data.catalog) {
            if (c && c.name) catMap.set(c.name.trim().toLowerCase(), c);
          }
          for (const lc of liveCatalogRef.current) {
            if (lc && lc.name && !catMap.has(lc.name.trim().toLowerCase())) {
              catMap.set(lc.name.trim().toLowerCase(), lc);
            }
          }
          const mergedCatalog = Array.from(catMap.values());
          liveCatalogRef.current = mergedCatalog;
          setCatalog(mergedCatalog);
          saveStoredCatalog(mergedCatalog);
        }

        if (pendingActionsRef.current.length === 0) {
          setSyncStatus("synced");
        }
      } catch (err) {
        console.error("Action dispatch batch error:", err);
        setSyncStatus("error");
        // Brief pause before trying next batch if network flaked
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    isDrainingRef.current = false;
  }, [mergeServerWithLocal]);

  // Dispatch Action immediately into the atomic sequential queue
  const dispatchAction = useCallback(
    (action: InventoryAction) => {
      lastLocalEditTimestamp.current = Date.now();
      pendingActionsRef.current.push(action);
      drainActionQueue();
    },
    [drainActionQueue]
  );

  // Pull Cloud Data (Fetches additions/updates made from any other device)
  const pullCloudData = useCallback(
    async (silent = false) => {
      // If local actions are pending or in flight, or if user edited within 5s, DO NOT interrupt!
      if (
        isDrainingRef.current ||
        pendingActionsRef.current.length > 0 ||
        Date.now() - lastLocalEditTimestamp.current < 5000
      ) {
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
          const merged = mergeServerWithLocal(data.users);
          liveUsersRef.current = merged;
          saveStoredUsers(merged);
          setUsers(merged);
        }

        if (Array.isArray(data.catalog)) {
          const catMap = new Map<string, CatalogItem>();
          for (const c of data.catalog) {
            if (c && c.name) catMap.set(c.name.trim().toLowerCase(), c);
          }
          for (const lc of liveCatalogRef.current) {
            if (lc && lc.name && !catMap.has(lc.name.trim().toLowerCase())) {
              catMap.set(lc.name.trim().toLowerCase(), lc);
            }
          }
          const mergedCatalog = Array.from(catMap.values());
          liveCatalogRef.current = mergedCatalog;
          saveStoredCatalog(mergedCatalog);
          setCatalog(mergedCatalog);
        }

        setSyncStatus("synced");
      } catch (err) {
        console.warn("Could not sync with cloud server:", err);
        if (!silent) setSyncStatus("offline");
      }
    },
    [mergeServerWithLocal]
  );

  // 1. Initial Load: Load cached local data instantly, then fetch true cloud state
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    const loadedCatalog = getStoredCatalog();
    liveUsersRef.current = loadedUsers;
    liveCatalogRef.current = loadedCatalog;
    setUsers(loadedUsers);
    setCatalog(loadedCatalog);
    setIsLoaded(true);

    pullCloudData(false);
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

  // Instant Search by user name or assigned item name (case-insensitive)
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      if (u.name && u.name.toLowerCase().includes(q)) return true;
      const assignments = Array.isArray(u.assignments) ? u.assignments : [];
      const hasItem = assignments.some(
        (a) => a && a.itemName && a.itemName.toLowerCase().includes(q)
      );
      return hasItem;
    });
  }, [users, searchQuery]);

  const totalAssignedCount = useMemo(() => {
    return users.reduce((acc, user) => {
      const assignments = Array.isArray(user.assignments) ? user.assignments : [];
      return (
        acc +
        assignments.reduce((sum, a) => sum + (Number(a?.quantity) || 1), 0)
      );
    }, 0);
  }, [users]);

  // Assign item to user (Case-insensitive check, adds to catalog if new)
  const handleAssignItem = (userId: string, itemName: string) => {
    const trimmed = itemName.trim();
    if (!trimmed) return;
    const targetLower = trimmed.toLowerCase();
    lastLocalEditTimestamp.current = Date.now();

    // 1. Synchronous Live Update from liveCatalogRef
    const currentCatalog = liveCatalogRef.current;
    let catalogItem = currentCatalog.find(
      (c) => c && c.name && c.name.trim().toLowerCase() === targetLower
    );

    let updatedCatalog = currentCatalog;
    if (!catalogItem) {
      catalogItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
      };
      updatedCatalog = [catalogItem, ...currentCatalog];
      liveCatalogRef.current = updatedCatalog;
      setCatalog(updatedCatalog);
      saveStoredCatalog(updatedCatalog);
    }

    const generatedAssignmentId = `assign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 2. Synchronous Live Update from liveUsersRef
    const currentUsers = liveUsersRef.current;
    const updatedUsers = currentUsers.map((u) => {
      if (u.id !== userId) return u;

      const currentAssignments = Array.isArray(u.assignments) ? u.assignments : [];
      const existingIndex = currentAssignments.findIndex(
        (a) => a && a.itemName && a.itemName.trim().toLowerCase() === targetLower
      );

      if (existingIndex > -1) {
        const nextAssignments = [...currentAssignments];
        nextAssignments[existingIndex] = {
          ...nextAssignments[existingIndex],
          quantity: (nextAssignments[existingIndex].quantity || 1) + 1,
        };
        return { ...u, assignments: nextAssignments };
      }

      const newAssignment: UserAssignment = {
        id: generatedAssignmentId,
        itemId: catalogItem!.id,
        itemName: catalogItem!.name,
        quantity: 1,
      };

      return {
        ...u,
        assignments: [newAssignment, ...currentAssignments],
      };
    });

    liveUsersRef.current = updatedUsers;
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // 3. Dispatch atomic action with identical ID and itemName into the batch queue
    dispatchAction({
      type: "ASSIGN_ITEM",
      userId,
      itemName: trimmed,
      quantity: 1,
      assignmentId: generatedAssignmentId,
    });

    showToast(`Assigned ${catalogItem.name}`);
  };

  // Increase quantity
  const handleIncreaseQuantity = (userId: string, assignment: UserAssignment) => {
    lastLocalEditTimestamp.current = Date.now();
    const itemLower = assignment.itemName.trim().toLowerCase();

    const currentUsers = liveUsersRef.current;
    const updatedUsers = currentUsers.map((u) => {
      if (u.id !== userId) return u;
      const currentAssignments = Array.isArray(u.assignments) ? u.assignments : [];
      return {
        ...u,
        assignments: currentAssignments.map((a) =>
          a && (a.id === assignment.id || a.itemName.trim().toLowerCase() === itemLower)
            ? { ...a, quantity: (a.quantity || 1) + 1 }
            : a
        ),
      };
    });

    liveUsersRef.current = updatedUsers;
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    dispatchAction({
      type: "UPDATE_QUANTITY",
      userId,
      assignmentId: assignment.id,
      itemName: assignment.itemName,
      delta: 1,
    });
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

    lastLocalEditTimestamp.current = Date.now();
    const itemLower = assignment.itemName.trim().toLowerCase();

    const currentUsers = liveUsersRef.current;
    const updatedUsers = currentUsers.map((u) => {
      if (u.id !== userId) return u;
      const currentAssignments = Array.isArray(u.assignments) ? u.assignments : [];
      return {
        ...u,
        assignments: currentAssignments.map((a) =>
          a && (a.id === assignment.id || a.itemName.trim().toLowerCase() === itemLower)
            ? { ...a, quantity: Math.max(1, (a.quantity || 1) - 1) }
            : a
        ),
      };
    });

    liveUsersRef.current = updatedUsers;
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    dispatchAction({
      type: "UPDATE_QUANTITY",
      userId,
      assignmentId: assignment.id,
      itemName: assignment.itemName,
      delta: -1,
    });
  };

  // Remove assignment with in-website confirmation modal
  const handleRequestRemove = (userId: string, assignment: UserAssignment) => {
    setConfirmState({
      isOpen: true,
      title: "Remove Assignment",
      message: `Remove "${assignment.itemName}" from this user?`,
      confirmText: "Remove",
      onConfirm: () => {
        lastLocalEditTimestamp.current = Date.now();
        const itemLower = assignment.itemName.trim().toLowerCase();
        deletedRecentlyRef.current.set(itemLower, Date.now());

        const currentUsers = liveUsersRef.current;
        const updatedUsers = currentUsers.map((u) => {
          if (u.id !== userId) return u;
          const currentAssignments = Array.isArray(u.assignments) ? u.assignments : [];
          return {
            ...u,
            assignments: currentAssignments.filter(
              (a) => a && a.id !== assignment.id && a.itemName.trim().toLowerCase() !== itemLower
            ),
          };
        });

        // If no user has this item assigned anymore, remove it from catalog suggestions
        const stillInUse = updatedUsers.some((u) => {
          const asgs = Array.isArray(u.assignments) ? u.assignments : [];
          return asgs.some((a) => a && a.itemName && a.itemName.trim().toLowerCase() === itemLower);
        });

        let updatedCatalog = liveCatalogRef.current;
        if (!stillInUse) {
          updatedCatalog = liveCatalogRef.current.filter(
            (c) => c && c.name && c.name.trim().toLowerCase() !== itemLower
          );
          liveCatalogRef.current = updatedCatalog;
          setCatalog(updatedCatalog);
          saveStoredCatalog(updatedCatalog);
        }

        liveUsersRef.current = updatedUsers;
        setUsers(updatedUsers);
        saveStoredUsers(updatedUsers);

        dispatchAction({
          type: "REMOVE_ASSIGNMENT",
          userId,
          assignmentId: assignment.id,
          itemName: assignment.itemName,
        });

        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast(`Removed ${assignment.itemName}`);
      },
    });
  };

  // Remove item from Catalog permanently so it is never suggested/recalled again
  const handleRemoveCatalogItem = (itemName: string) => {
    const trimmed = itemName.trim();
    const targetLower = trimmed.toLowerCase();
    lastLocalEditTimestamp.current = Date.now();
    deletedRecentlyRef.current.set(targetLower, Date.now());

    // 1. Immediately remove from catalog locally
    const updatedCatalog = liveCatalogRef.current.filter(
      (c) => c && c.name && c.name.trim().toLowerCase() !== targetLower
    );
    liveCatalogRef.current = updatedCatalog;
    setCatalog(updatedCatalog);
    saveStoredCatalog(updatedCatalog);

    // 2. Also remove any lingering assignments of this item locally
    const currentUsers = liveUsersRef.current;
    const updatedUsers = currentUsers.map((u) => {
      const currentAssignments = Array.isArray(u.assignments) ? u.assignments : [];
      return {
        ...u,
        assignments: currentAssignments.filter(
          (a) => a && a.itemName && a.itemName.trim().toLowerCase() !== targetLower
        ),
      };
    });
    liveUsersRef.current = updatedUsers;
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // 3. Dispatch action to server
    dispatchAction({
      type: "REMOVE_CATALOG_ITEM",
      itemName: trimmed,
    });

    showToast(`Removed "${trimmed}" from item list`);
  };

  // Delete User with in-website confirmation
  const handleRequestDeleteUser = (user: InventoryUser) => {
    setConfirmState({
      isOpen: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${user.name}"? This will remove the user and all their assignments.`,
      confirmText: "Delete User",
      onConfirm: () => {
        const currentUsers = liveUsersRef.current;
        const updatedUsers = currentUsers.filter((u) => u.id !== user.id);
        liveUsersRef.current = updatedUsers;
        setUsers(updatedUsers);
        saveStoredUsers(updatedUsers);

        dispatchAction({
          type: "DELETE_USER",
          userId: user.id,
        });

        setActiveUserId(null);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast(`Deleted ${user.name}`);
      },
    });
  };

  // Add User
  const handleAddUser = (newUserData: Omit<InventoryUser, "id" | "assignments">) => {
    const trimmedName = newUserData.name.trim();
    const newUser: InventoryUser = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      assignments: [],
    };
    const currentUsers = liveUsersRef.current;
    const updatedUsers = [newUser, ...currentUsers];
    liveUsersRef.current = updatedUsers;
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    dispatchAction({
      type: "ADD_USER",
      name: trimmedName,
    });

    showToast(`Added ${trimmedName}`);
  };

  // Reset Data (with in-website confirmation modal)
  const handleRequestReset = () => {
    setConfirmState({
      isOpen: true,
      title: "Reset Inventory",
      message: "Reset all users and assignments to default state on all devices?",
      confirmText: "Reset All",
      onConfirm: () => {
        const reset = resetAllData();
        liveUsersRef.current = reset.users;
        liveCatalogRef.current = reset.catalog;
        setUsers(reset.users);
        setCatalog(reset.catalog);
        setActiveUserId(null);

        dispatchAction({ type: "RESET" });

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
                onSelectUser={(u) => setActiveUserId(u.id)}
                onAssignItem={(u) => setActiveUserId(u.id)}
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
        onClose={() => setActiveUserId(null)}
        catalog={catalog}
        onAssignItem={handleAssignItem}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
        onRequestRemove={handleRequestRemove}
        onRequestDeleteUser={handleRequestDeleteUser}
        onRemoveCatalogItem={handleRemoveCatalogItem}
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
        confirmText={confirmState.confirmText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
