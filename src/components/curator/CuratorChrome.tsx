"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CuratorSidebar } from "./CuratorSidebar";
import { CuratorTopbar } from "./CuratorTopbar";

const COLLAPSE_STORAGE_KEY = "biosphere_curator_sidebar_collapsed";

export function CuratorChrome({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // One-time sync from a browser-only external store (localStorage) after mount —
    // reading it during the initial render would desync from the server-rendered HTML.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable (private browsing, etc.) — default to expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // ignore write failures
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-sage-50/60">
      <CuratorSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <CuratorTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
