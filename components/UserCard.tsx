"use client";

import React from "react";
import { Plus, ChevronRight, PackageCheck, AlertCircle } from "lucide-react";
import { InventoryUser } from "@/types/inventory";

interface UserCardProps {
  user: InventoryUser;
  onSelectUser: (user: InventoryUser) => void;
  onAssignItem: (user: InventoryUser) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onSelectUser,
  onAssignItem,
}) => {
  const totalItemCount = user.assignments.reduce(
    (acc, curr) => acc + (curr.quantity || 1),
    0
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      onClick={() => onSelectUser(user)}
      className="group relative bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-4 sm:p-5 transition-all duration-150 hover:shadow-md cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top: Avatar, Name, Role, & Add '+' Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-2xs ${
                user.avatarBg || "bg-blue-600"
              }`}
            >
              {getInitials(user.name)}
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-1.5">
                {user.name}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {user.role} •{" "}
                <span className="text-slate-600 font-medium">
                  {user.department}
                </span>
              </p>
            </div>
          </div>

          {/* Right '+' Button to add items */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              title={`Assign item to ${user.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onAssignItem(user);
              }}
              className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 flex items-center justify-center transition-all duration-150 shadow-2xs active:scale-95 group/btn"
            >
              <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90 duration-200" />
            </button>
          </div>
        </div>

        {/* Assigned Items Preview Section */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700 flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
              Assigned Items ({totalItemCount}):
            </span>
          </div>

          {user.assignments.length === 0 ? (
            <div className="flex items-center gap-1.5 py-1.5 text-xs text-slate-400 italic">
              <AlertCircle className="w-3.5 h-3.5" />
              No equipment currently assigned
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-hidden">
              {user.assignments.map((asg) => (
                <span
                  key={asg.id}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                  title={`${asg.itemName} (${asg.category})${
                    asg.serialNumber ? ` - S/N: ${asg.serialNumber}` : ""
                  }`}
                >
                  <span className="truncate max-w-[170px] font-medium">
                    {asg.itemName}
                  </span>
                  {asg.quantity > 1 && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                      ×{asg.quantity}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Subtle Footer */}
      <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50">
        <span>Click row for full specs</span>
        <span className="text-blue-600 font-medium group-hover:underline">
          View details →
        </span>
      </div>
    </div>
  );
};
