"use client";

import React from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Hash,
  Mail,
  Briefcase,
  Layers,
  PackageCheck,
  AlertCircle
} from "lucide-react";
import { InventoryUser, UserAssignment } from "@/types/inventory";

interface UserDetailModalProps {
  user: InventoryUser | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAssignModal: (user: InventoryUser) => void;
  onUnassignItem: (userId: string, assignmentId: string) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenAssignModal,
  onUnassignItem,
}) => {
  if (!isOpen || !user) return null;

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

  const handleRemove = (assignment: UserAssignment) => {
    const ok = window.confirm(
      `Are you sure you want to unassign "${assignment.itemName}" from ${user.name}? This will return it back to stock.`
    );
    if (ok) {
      onUnassignItem(user.id, assignment.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-blue-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Profile Section */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md border-2 border-white/20 ${
                user.avatarBg || "bg-blue-600"
              }`}
            >
              {getInitials(user.name)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-medium">
                  {user.department}
                </span>
              </div>
              <p className="text-sm text-blue-100 flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-3.5 h-3.5" />
                {user.role}
              </p>
              <p className="text-xs text-blue-200 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
                <span className="opacity-50">•</span>
                <Calendar className="w-3.5 h-3.5" />
                Joined: {user.joinedDate}
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

        {/* Quick Stat Summary Bar & Add Button */}
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div>
              Total Units:{" "}
              <strong className="text-blue-700 font-bold text-sm">
                {totalItemCount}
              </strong>
            </div>
            <div className="w-px h-4 bg-slate-300" />
            <div>
              Distinct Equipment:{" "}
              <strong className="text-blue-700 font-bold text-sm">
                {user.assignments.length}
              </strong>
            </div>
          </div>

          {/* Direct '+' / 'Assign Equipment' button inside user detail */}
          <button
            type="button"
            onClick={() => onOpenAssignModal(user)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Equipment</span>
          </button>
        </div>

        {/* Equipment List Section */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-blue-600" />
              Everything Assigned to {user.name}
            </h3>
            <span className="text-xs text-slate-400">
              {user.assignments.length} assigned items
            </span>
          </div>

          {user.assignments.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">
                No items assigned yet
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click &quot;Assign Equipment&quot; above to select from listed items
                or register a new equipment item for this user.
              </p>
              <button
                type="button"
                onClick={() => onOpenAssignModal(user)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                Assign First Item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {user.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-xs transition-all flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-slate-900">
                        {assignment.itemName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {assignment.category}
                      </span>
                      {assignment.quantity > 1 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-800">
                          Qty: {assignment.quantity}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                      {assignment.serialNumber && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Hash className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            Serial/Tag:{" "}
                            <span className="font-mono font-medium text-slate-800">
                              {assignment.serialNumber}
                            </span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Assigned: {assignment.assignedDate}</span>
                      </div>

                      {assignment.notes && (
                        <div className="col-span-full text-slate-600 italic mt-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          &quot;{assignment.notes}&quot;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Return / Unassign Action */}
                  <div className="shrink-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(assignment)}
                      title="Return / Unassign this item"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>All changes are automatically saved.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
