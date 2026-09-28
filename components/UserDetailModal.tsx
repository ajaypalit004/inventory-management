"use client";

import React, { useState, useRef } from "react";
import { X, Plus, Minus, Trash2, Package, Search } from "lucide-react";
import { CatalogItem, InventoryUser, UserAssignment } from "@/types/inventory";

interface UserDetailModalProps {
  user: InventoryUser | null;
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  onAssignItem: (userId: string, itemName: string) => void;
  onIncreaseQuantity: (userId: string, assignment: UserAssignment) => void;
  onDecreaseQuantity: (userId: string, assignment: UserAssignment) => void;
  onRequestRemove: (userId: string, assignment: UserAssignment) => void;
  onRequestDeleteUser: (user: InventoryUser) => void;
  onRemoveCatalogItem: (itemName: string) => void;
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
  onRemoveCatalogItem,
}) => {
  const [itemQuery, setItemQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const trimmedQuery = itemQuery.trim();
  const queryLower = trimmedQuery.toLowerCase();

  const safeCatalog = Array.isArray(catalog)
    ? catalog.filter((c) => c && typeof c.name === "string")
    : [];
  const safeAssignments = Array.isArray(user.assignments)
    ? user.assignments.filter((a) => a && typeof a.itemName === "string")
    : [];

  // Case-insensitive filtering of listed catalog items
  const matchingCatalogItems = safeCatalog.filter((c) =>
    c.name.trim().toLowerCase().includes(queryLower)
  );

  const exactMatch = safeCatalog.find(
    (c) => c.name.trim().toLowerCase() === queryLower
  );

  const handleAddItem = (itemName: string) => {
    const trimmed = itemName.trim();
    if (!trimmed) return;
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setItemQuery("");
    onAssignItem(user.id, trimmed);
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawVal = inputRef.current ? inputRef.current.value : itemQuery;
    const toAdd = rawVal.trim();
    if (toAdd) {
      handleAddItem(toAdd);
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
              {safeAssignments.length} assigned items
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar directly below name */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search or type item to add..."
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFormSubmit();
                  }
                }}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {itemQuery && (
                <button
                  type="button"
                  onClick={() => {
                    if (inputRef.current) inputRef.current.value = "";
                    setItemQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-colors shadow-2xs flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          {/* Quick matching catalog items suggestions dropdown when typing */}
          {trimmedQuery && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 max-h-48 overflow-y-auto space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Suggested Items:</span>
                <span className="text-[10px] text-slate-400">Click &quot;Add&quot; to assign • Trash icon to remove from list</span>
              </div>
              {matchingCatalogItems.length === 0 ? (
                <button
                  type="button"
                  onClick={() => handleAddItem(trimmedQuery)}
                  className="w-full text-left p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors flex items-center justify-between"
                >
                  <span>Add new item &quot;{trimmedQuery}&quot;</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  {matchingCatalogItems.map((catItem, idx) => (
                    <div
                      key={catItem.id ? `${catItem.id}-${idx}` : `match-${catItem.name}-${idx}`}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-200 text-slate-800 text-xs transition-colors"
                    >
                      <span className="font-medium text-slate-800 truncate mr-2">
                        {catItem.name}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddItem(catItem.name)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveCatalogItem(catItem.name)}
                          title={`Delete "${catItem.name}" from item list`}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {!exactMatch && (
                    <button
                      type="button"
                      onClick={() => handleAddItem(trimmedQuery)}
                      className="w-full text-left p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors flex items-center justify-between mt-1 active:scale-95"
                    >
                      <span>Add new item &quot;{trimmedQuery}&quot;</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* If search query is empty but catalog has items: Clean management chips */}
          {!trimmedQuery && safeCatalog.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/50">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5">
                <span>Available listed items ({safeCatalog.length}):</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pt-0.5">
                {safeCatalog.map((item, idx) => (
                  <span
                    key={item.id ? `${item.id}-${idx}` : `item-${item.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <span className="font-medium mr-1">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleAddItem(item.name)}
                      title={`Add "${item.name}" to ${user.name}`}
                      className="px-1.5 py-0.5 rounded-md bg-blue-100/70 hover:bg-blue-600 hover:text-white text-blue-700 font-semibold text-[11px] transition-colors"
                    >
                      + Add
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCatalogItem(item.name)}
                      title={`Remove "${item.name}" from item list`}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Linear List of Assigned Items with format: "+ quantity -" */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {safeAssignments.length === 0 ? (
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
            safeAssignments.map((assignment, idx) => (
              <div
                key={assignment.id ? `${assignment.id}-${idx}` : `assign-${assignment.itemName}-${idx}`}
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
                      onClick={() => onIncreaseQuantity(user.id, assignment)}
                      className="w-6 h-6 rounded-full bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-300 hover:border-blue-300 flex items-center justify-center transition-colors shadow-2xs active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Quantity */}
                    <span className="text-sm font-bold text-slate-800 min-w-[18px] text-center">
                      {assignment.quantity || 1}
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
