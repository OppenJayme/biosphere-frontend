"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDownIcon, LogOutIcon } from "@/components/icons";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import { signOut } from "@/features/auth/actions";

function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        role="menuitem"
        disabled={pending}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none disabled:opacity-60"
      >
        <LogOutIcon className="h-4 w-4" />
        Sign out
      </button>
      <PendingOverlay pending={pending} label="Signing out…" />
    </>
  );
}

/** The signed-in curator's name and role, opening a menu with Sign out. */
export function AccountMenu({ profile }: { profile: { fullName: string; role: string } | null }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape (returning focus to the button) or on a click outside the menu.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-sage-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-xs font-semibold text-white">
          {profile ? initialsFor(profile.fullName) : "?"}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-[11px] text-zinc-500">
            {profile ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase() : "Signed in"}
          </span>
          <span className="text-sm font-semibold text-forest-900">
            {profile ? profile.fullName : "Curator account unavailable"}
          </span>
        </span>
        <ChevronDownIcon
          className={`hidden h-4 w-4 text-zinc-400 transition-transform sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg"
        >
          {profile && (
            <p className="truncate border-b border-black/10 px-4 py-2.5 text-xs text-zinc-500">
              Signed in as <span className="font-semibold text-zinc-800">{profile.fullName}</span>
            </p>
          )}
          <form action={signOut}>
            <SignOutButton />
          </form>
        </div>
      )}
    </div>
  );
}
