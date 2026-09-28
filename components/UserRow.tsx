"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { InventoryUser, UserAssignment } from "@/types/inventory";

interface UserRowProps {
  user: InventoryUser;
  onSelectUser: (user: InventoryUser) => void;
  onAssignItem: (user: InventoryUser) => void;
  onIncreaseQuantity: (userId: string, assignmentId: string) => void;
  onDecreaseQuantity: (userId: string, assignment: UserAssignment) => void;
}

export const UserRow: React.FC<UserRowProps> = ({
  user,
  onSelectUser,
  onAssignItem,
  onIncreaseQuantity,
  onDecreaseQuantity,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-3 sm:p-4 transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:shadow-xs">
      {/* Left: User Initials & Name */}
      <div
        onClick={() => onSelectUser(user)}
        className="flex items-center gap-3 min-w-[200px] cursor-pointer group"
      >
        <div className="w-10 h-10 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {user.name}
          </h3>
          <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view details
          </span>
        </div>
      </div>

      {/* Center: Linear list of assigned items with circular + and - quantity controls */}
      <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0 py-1">
        {user.assignments.length === 0 ? (
          <span className="text-xs text-slate-400 italic">
            No items assigned
          </span>
        ) : (
          user.assignments.map((asg) => (
            <div
              key={asg.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-200 transition-colors"
            >
              {/* Item Name only */}
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                {asg.itemName}
              </span>

              {/* Circular - and + controls on the right of item name */}
              <div className="flex items-center gap-1.5 ml-1 pl-1.5 border-l border-slate-200">
                <button
                  type="button"
                  title="Decrease quantity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecreaseQuantity(user.id, asg);
                  }}
                  className="w-5 h-5 rounded-full bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-300 hover:border-red-300 flex items-center justify-center transition-colors shadow-2xs active:scale-90"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span className="text-xs font-bold text-slate-800 min-w-[14px] text-center">
                  {asg.quantity}
                </span>

                <button
                  type="button"
                  title="Increase quantity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIncreaseQuantity(user.id, asg.id);
                  }}
                  className="w-5 h-5 rounded-full bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-300 hover:border-blue-300 flex items-center justify-center transition-colors shadow-2xs active:scale-90"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right: Dedicated '+' button to add items */}
      <div className="shrink-0 flex items-center justify-end">
        <button
          type="button"
          title={`Add item to ${user.name}`}
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
