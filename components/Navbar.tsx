"use client";

import React from "react";
import { Package, Plus, RotateCcw, RefreshCw, CheckCircle2, Cloud, FileSpreadsheet } from "lucide-react";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

interface NavbarProps {
  userCount: number;
  totalAssigned: number;
  syncStatus: SyncStatus;
  onOpenAddUser: () => void;
  onResetData: () => void;
  onManualRefresh: () => void;
  onExportExcel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userCount,
  totalAssigned,
  syncStatus,
  onOpenAddUser,
  onResetData,
  onManualRefresh,
  onExportExcel,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Stats */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Inventory
                </h1>
                {/* Cross-Device Live Sync Indicator */}
                {syncStatus === "syncing" && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/80 rounded-full">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-600" />
                    <span>Syncing...</span>
                  </span>
                )}
                {syncStatus === "synced" && (
                  <span
                    title="Synchronized across all devices"
                    className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Cloud Synced</span>
                  </span>
                )}
                {(syncStatus === "error" || syncStatus === "offline") && (
                  <button
                    onClick={onManualRefresh}
                    title="Click to retry syncing"
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Retry Sync</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-blue-700">{userCount}</span> users •{" "}
                <span className="font-semibold text-blue-700">{totalAssigned}</span> items assigned
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onManualRefresh}
              title="Refresh / Sync from cloud"
              type="button"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncStatus === "syncing" ? "animate-spin text-blue-600" : ""}`}
              />
            </button>

            {/* Export to Excel button */}
            <button
              onClick={onExportExcel}
              title="Export all inventory data into an Excel spreadsheet (.xlsx)"
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200/80 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={onOpenAddUser}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xs active:scale-95"
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
