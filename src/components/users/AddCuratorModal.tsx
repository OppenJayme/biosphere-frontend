"use client";

import { useState } from "react";
import { Field, fieldClasses } from "@/components/ui/Field";
import { CloseIcon, UsersIcon, UploadIcon } from "@/components/icons";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AddCuratorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("Dr. Sheldon Cruz");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Active");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8 sm:items-center">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-start gap-3 border-b border-black/10 px-6 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
            <UsersIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-zinc-900">Add Curator</h2>
            <p className="text-xs text-zinc-500">Create a curator account with full collection access.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 text-zinc-400 hover:text-zinc-600">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-forest-700 text-base font-semibold text-white">
              {initialsOf(name) || "—"}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-800"
            >
              <UploadIcon className="h-4 w-4" />
              Upload photo
            </button>
          </div>
          <p className="-mt-3 text-xs text-zinc-400">PNG or JPG, up to 2MB</p>

          <Field label="Full name" htmlFor="curator-name">
            <input
              id="curator-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Sheldon Cruz"
              className={`${fieldClasses} mt-1.5`}
            />
          </Field>

          <Field label="Email address" htmlFor="curator-email">
            <input
              id="curator-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="scruz@usc.edu.ph"
              className={`${fieldClasses} mt-1.5`}
            />
          </Field>

          <Field label="Status" htmlFor="curator-status">
            <select
              id="curator-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${fieldClasses} mt-1.5`}
            >
              <option>Active</option>
              <option>Pending Invite</option>
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Add Curator
          </button>
        </div>
      </div>
    </div>
  );
}
