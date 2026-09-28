"use client";

import React, { useState } from "react";
import { X, Plus, Minus, Trash2, Package, Search } from "lucide-react";
import { CatalogItem, InventoryUser, UserAssignment } from "@/types/inventory";

interface UserDetailModalProps {
  user: InventoryUser | null;
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  onAssignItem: (userId: string, itemName: string) => void;
  onIncreaseQuantity: (userId: string, assignmentId: string) => void;
  onDecreaseQuantity: (userId: string, assignment: UserAssignment) => void;
  onRequestRemove: (userId: string, assignment: UserAssignment) => void;
  onRequestDeleteUser: (user: InventoryUser) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  catalog,
  onAssignItem,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRequestRemove,
  onRequestDeleteUser,
}) => {
  const [itemQuery, setItemQuery] = useState("");

  if (!isOpen || !user) return null;

  const trimmedQuery = itemQuery.trim();

  // Filter listed catalog items matching user input
  const matchingCatalogItems = catalog.filter((c) =>
    c.name.toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  const exactMatch = catalog.find(
    (c) => c.name.toLowerCase() === trimmedQuery.toLowerCase()
  );

  const handleAddItem = (itemName: string) => {
    if (!itemName.trim()) return;
    onAssignItem(user.id, itemName.trim());
    setItemQuery("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmedQuery) {
      handleAddItem(trimmedQuery);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-blue-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold leading-tight">{user.name}</h2>
            <p className="text-xs text-blue-100">
              {user.assignments.length} assigned items
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar directly below name: user just searches any item and adds it directly */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search or type any item to add directly..."
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={!trimmedQuery}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors shadow-2xs flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          {/* Quick matching catalog items dropdown / chips if user is typing */}
          {trimmedQuery && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 max-h-36 overflow-y-auto space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Suggested Listed Items:
              </div>
              {matchingCatalogItems.length === 0 ? (
                <button
                  type="button"
                  onClick={() => handleAddItem(trimmedQuery)}
                  className="w-full text-left p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors flex items-center justify-between"
                >
                  <span>Add new item &quot;{trimmedQuery}&quot;</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              ) : (
                matchingCatalogItems.map((catItem) => (
                  <button
                    key={catItem.id}
                    type="button"
                    onClick={() => handleAddItem(catItem.name)}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-blue-50 text-slate-800 text-xs transition-colors flex items-center justify-between group"
                  >
                    <span className="font-medium group-hover:text-blue-600">
                      {catItem.name}
                    </span>
                    <span className="text-[11px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                      <Plus className="w-3 h-3" /> Add
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Linear List of Assigned Items with format: "+ quantity -" */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {user.assignments.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">
                No items assigned to {user.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Use the search bar above to assign items directly.
              </p>
            </div>
          ) : (
            user.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors flex items-center justify-between gap-3 shadow-2xs"
              >
                {/* Item Name */}
                <span className="text-sm font-medium text-slate-900 truncate">
                  {assignment.itemName}
                </span>

                {/* Right side: Format: "+ quantity -" as requested */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    {/* '+' button */}
                    <button
                      type="button"
                      title="Increase quantity"
                      onClick={() => onIncreaseQuantity(user.id, assignment.id)}
                      className="w-6 h-6 rounded-full bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-300 hover:border-blue-300 flex items-center justify-center transition-colors shadow-2xs active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Quantity */}
                    <span className="text-sm font-bold text-slate-800 min-w-[18px] text-center">
                      {assignment.quantity}
                    </span>

                    {/* '-' button */}
                    <button
                      type="button"
                      title="Decrease quantity"
                      onClick={() => onDecreaseQuantity(user.id, assignment)}
                      className="w-6 h-6 rounded-full bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-300 hover:border-red-300 flex items-center justify-center transition-colors shadow-2xs active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Remove Trash Button */}
                  <button
                    type="button"
                    title="Remove item"
                    onClick={() => onRequestRemove(user.id, assignment)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onRequestDeleteUser(user)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete User</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
