"use client";

import React, { useState } from "react";
import { X, Plus, Search, Check, Package } from "lucide-react";
import { CatalogItem, InventoryUser } from "@/types/inventory";

interface AssignItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: InventoryUser | null;
  catalog: CatalogItem[];
  onAssignItem: (userId: string, itemName: string) => void;
}

export const AssignItemModal: React.FC<AssignItemModalProps> = ({
  isOpen,
  onClose,
  user,
  catalog,
  onAssignItem,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen || !user) return null;

  const trimmedSearch = searchTerm.trim();

  // Filter existing catalog items by name only (no categories or filters)
  const filteredCatalog = catalog.filter((item) =>
    item.name.toLowerCase().includes(trimmedSearch.toLowerCase())
  );

  const exactMatch = catalog.find(
    (item) => item.name.toLowerCase() === trimmedSearch.toLowerCase()
  );

  const handleSelect = (itemName: string) => {
    onAssignItem(user.id, itemName);
    setSearchTerm("");
    onClose();
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedSearch) return;
    onAssignItem(user.id, trimmedSearch);
    setSearchTerm("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-blue-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight">Add Item</h3>
              <p className="text-xs text-blue-100">
                Assigning to <span className="font-bold">{user.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input to search or add new */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleAddNew} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Type item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                autoFocus
              />
            </div>
            {trimmedSearch && !exactMatch && (
              <button
                type="submit"
                className="shrink-0 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add &quot;{trimmedSearch}&quot;
              </button>
            )}
          </form>
        </div>

        {/* Listed Items (Catalog) */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <div className="text-xs font-semibold text-slate-500 px-1">
            Listed Items ({filteredCatalog.length})
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-500">
              {trimmedSearch ? (
                <div>
                  No listed item named &quot;{trimmedSearch}&quot;.
                  <button
                    type="button"
                    onClick={() => handleSelect(trimmedSearch)}
                    className="block mx-auto mt-2 text-blue-600 font-semibold hover:underline"
                  >
                    Click here to add &quot;{trimmedSearch}&quot; as a new item
                  </button>
                </div>
              ) : (
                "Type an item name above to add it to listed items."
              )}
            </div>
          ) : (
            filteredCatalog.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.name)}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </span>

                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white border border-blue-200 group-hover:border-blue-600 flex items-center justify-center transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
