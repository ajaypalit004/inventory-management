"use client";

import React from "react";
import { Package, Plus, Layers, RotateCcw } from "lucide-react";

interface NavbarProps {
  catalogCount: number;
  userCount: number;
  totalAssigned: number;
  onOpenAddUser: () => void;
  onOpenCatalog: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  catalogCount,
  userCount,
  totalAssigned,
  onOpenAddUser,
  onOpenCatalog,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Stats */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Inventory Desk
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Minimal
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>
                  <strong className="text-blue-700 font-semibold">{userCount}</strong> Users
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <strong className="text-blue-700 font-semibold">{totalAssigned}</strong> Items Assigned
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <strong className="text-blue-700 font-semibold">{catalogCount}</strong> in Catalog
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenCatalog}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-2xs"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Catalog ({catalogCount})</span>
            </button>

            <button
              onClick={onOpenAddUser}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xs shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm("Reset all inventory & user assignments to default sample data?")) {
                  onResetData();
                }
              }}
              title="Reset to sample data"
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
