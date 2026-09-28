"use client";

import React from "react";
import { X, Plus, Trash2, Package } from "lucide-react";
import { InventoryUser, UserAssignment } from "@/types/inventory";

interface UserDetailModalProps {
  user: InventoryUser | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAssignModal: (user: InventoryUser) => void;
  onRequestRemove: (userId: string, assignment: UserAssignment) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenAssignModal,
  onRequestRemove,
}) => {
  if (!isOpen || !user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-blue-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {getInitials(user.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-xs text-blue-100">
                {user.assignments.length} assigned items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAssignModal(user)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Item</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linear List of Items - Just item name and remove action */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          {user.assignments.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">
                No items assigned to {user.name}
              </p>
              <button
                type="button"
                onClick={() => onOpenAssignModal(user)}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign First Item
              </button>
            </div>
          ) : (
            user.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors flex items-center justify-between gap-3 shadow-2xs"
              >
                {/* Item Name Only */}
                <span className="text-sm font-medium text-slate-900 truncate">
                  {assignment.itemName}
                </span>

                {/* Remove button */}
                <button
                  type="button"
                  title="Remove item"
                  onClick={() => onRequestRemove(user.id, assignment)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpenAssignModal(user)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Another Item
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
