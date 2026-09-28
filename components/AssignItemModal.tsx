"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  Plus,
  Package,
  Sparkles,
  Check,
  Tag,
  Hash,
  AlertCircle
} from "lucide-react";
import { CatalogItem, InventoryUser, ItemCategory } from "@/types/inventory";

interface AssignItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: InventoryUser | null;
  catalog: CatalogItem[];
  onAssignExistingItem: (
    userId: string,
    item: CatalogItem,
    quantity: number,
    serialNumber?: string,
    notes?: string
  ) => void;
  onAddNewAndAssign: (
    userId: string,
    newItem: {
      name: string;
      category: ItemCategory;
      model?: string;
      description?: string;
      quantity: number;
      serialNumber?: string;
      notes?: string;
    }
  ) => void;
}

const CATEGORIES: ItemCategory[] = [
  "Computers & Laptops",
  "Displays & Monitors",
  "Peripherals & Input",
  "Mobile & Tablets",
  "Audio & Communication",
  "Desk & Furniture",
  "Network & Hardware",
  "Accessories & Other",
];

export const AssignItemModal: React.FC<AssignItemModalProps> = ({
  isOpen,
  onClose,
  user,
  catalog,
  onAssignExistingItem,
  onAddNewAndAssign,
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "new">("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Selected item from catalog
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [assignQuantity, setAssignQuantity] = useState(1);
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");

  // New item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>("Computers & Laptops");
  const [newItemModel, setNewItemModel] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newSerialNumber, setNewSerialNumber] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newNotes, setNewNotes] = useState("");

  if (!isOpen || !user) return null;

  // Filter catalog items
  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectCatalogItem = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setAssignQuantity(1);
    setSerialNumber("");
    setNotes("");
  };

  const handleConfirmCatalogAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogItem) return;

    onAssignExistingItem(
      user.id,
      selectedCatalogItem,
      Number(assignQuantity) || 1,
      serialNumber.trim() || undefined,
      notes.trim() || undefined
    );

    // Reset and close
    setSelectedCatalogItem(null);
    onClose();
  };

  const handleCreateAndAssignNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAddNewAndAssign(user.id, {
      name: newItemName.trim(),
      category: newItemCategory,
      model: newItemModel.trim() || undefined,
      description: newItemDescription.trim() || undefined,
      quantity: Number(newQuantity) || 1,
      serialNumber: newSerialNumber.trim() || undefined,
      notes: newNotes.trim() || undefined,
    });

    // Reset form
    setNewItemName("");
    setNewItemModel("");
    setNewItemDescription("");
    setNewSerialNumber("");
    setNewQuantity(1);
    setNewNotes("");
    setActiveTab("catalog");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-blue-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Assign Equipment</h2>
              <p className="text-xs text-blue-100">
                Adding inventory for{" "}
                <span className="font-bold underline underline-offset-2">
                  {user.name}
                </span>{" "}
                ({user.department})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: Listed Items vs Add New to Catalog */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab("catalog");
              setSelectedCatalogItem(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "catalog"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Choose from Listed Items ({catalog.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("new");
              setSelectedCatalogItem(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "new"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            + Add New Item to Catalog
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "catalog" ? (
            selectedCatalogItem ? (
              /* Selected Item Assignment Form */
              <form onSubmit={handleConfirmCatalogAssignment} className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                      {selectedCatalogItem.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedCatalogItem.name}
                    </h3>
                    {selectedCatalogItem.model && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedCatalogItem.model}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogItem(null)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Change Item
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantity to Assign *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={assignQuantity}
                      onChange={(e) => setAssignQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      Serial / Asset Tag Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SN-882194-A"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes / Assignment Purpose (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Primary workstation, secondary travel monitor, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogItem(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Back to List
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Assign to {user.name}
                  </button>
                </div>
              </form>
            ) : (
              /* Search & Select from Catalog List */
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search listed items by name, model, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    autoFocus
                  />
                </div>

                {/* Category Filter Chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                      selectedCategory === "All"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredCatalog.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">
                        No listed items matched &quot;{searchTerm}&quot;
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Need this item? You can add it directly to listed items.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewItemName(searchTerm);
                          setActiveTab("new");
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add &quot;{searchTerm || "New Item"}&quot; as New Item
                      </button>
                    </div>
                  ) : (
                    filteredCatalog.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectCatalogItem(item)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
                              {item.category}
                            </span>
                          </div>
                          {item.model && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {item.model}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          className="shrink-0 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-200 group-hover:border-blue-600 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          ) : (
            /* Tab 2: Add New Item to Master Catalog & Assign */
            <form onSubmit={handleCreateAndAssignNewItem} className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Once added, this item is permanently saved</strong> into the
                  master listed items catalog so you won&apos;t have to type it again in the future!
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dell Latitude 5540 or Ergonomic Standing Desk"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Model / Specs (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Intel i7, 32GB RAM, 512GB SSD"
                    value={newItemModel}
                    onChange={(e) => setNewItemModel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity to Assign *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial / Asset Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TAG-2026-991"
                    value={newSerialNumber}
                    onChange={(e) => setNewSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Description or Assignment Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Standard issue engineer setup, wireless dongle included..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("catalog")}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Save to Catalog & Assign
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
