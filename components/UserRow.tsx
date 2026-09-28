"use client";

import React from "react";
import { Plus } from "lucide-react";
import { InventoryUser } from "@/types/inventory";

interface UserRowProps {
  user: InventoryUser;
  onSelectUser: (user: InventoryUser) => void;
  onAssignItem: (user: InventoryUser) => void;
}

export const UserRow: React.FC<UserRowProps> = ({
  user,
  onSelectUser,
  onAssignItem,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-3 sm:p-4 transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:shadow-xs">
      {/* Left: User Name */}
      <div
        onClick={() => onSelectUser(user)}
        className="flex items-center min-w-[180px] cursor-pointer group"
      >
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {user.name}
          </h3>
          <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view items
          </span>
        </div>
      </div>

      {/* Center: Linear list of assigned items - just item names */}
      <div
        onClick={() => onSelectUser(user)}
        className="flex-1 flex flex-wrap items-center gap-2 min-w-0 py-1 cursor-pointer"
      >
        {user.assignments.length === 0 ? (
          <span className="text-xs text-slate-400 italic">
            No items assigned
          </span>
        ) : (
          user.assignments.map((asg) => (
            <span
              key={asg.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
            >
              <span>{asg.itemName}</span>
              {asg.quantity > 1 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                  ×{asg.quantity}
                </span>
              )}
            </span>
          ))
        )}
      </div>

      {/* Right: Dedicated '+' button to open items and manage assignments */}
      <div className="shrink-0 flex items-center justify-end">
        <button
          type="button"
          title={`View and add items for ${user.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onAssignItem(user);
          }}
          className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 flex items-center justify-center transition-all duration-150 shadow-2xs active:scale-95 group/btn"
        >
          <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90 duration-150" />
        </button>
      </div>
    </div>
  );
};
