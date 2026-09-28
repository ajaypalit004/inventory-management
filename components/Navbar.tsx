"use client";

import React from "react";
import { Package, Plus, RotateCcw } from "lucide-react";

interface NavbarProps {
  userCount: number;
  totalAssigned: number;
  onOpenAddUser: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userCount,
  totalAssigned,
  onOpenAddUser,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Inventory
              </h1>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-blue-700">{userCount}</span> users •{" "}
                <span className="font-semibold text-blue-700">{totalAssigned}</span> items assigned
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddUser}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>

            <button
              onClick={onResetData}
              title="Reset data"
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
