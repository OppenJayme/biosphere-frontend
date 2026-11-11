"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { LogoMark } from "@/components/layout/LogoMark";
import {
  ArchiveIcon,
  CalendarIcon,
  HierarchyIcon,
  PawIcon,
  DocumentTextIcon,
  MailIcon,
  MapPinIcon,
  CubeIcon,
  ClipboardIcon,
  ChatIcon,
  UsersIcon,
  ChartBarIcon,
  CloseIcon,
} from "@/components/icons";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** For items that share a page and differ only by ?tab=. */
  tab?: string;
};

// Grouped as in the SRS information architecture (section 3.1.3), with
// General Inquiries and Visit Requests as separate entries.
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [{ label: "Dashboard", href: "/dashboard", icon: HierarchyIcon }] },
  {
    label: "Collection",
    items: [
      { label: "Specimens", href: "/specimens", icon: PawIcon },
      { label: "Cataloging", href: "/cataloging", icon: DocumentTextIcon },
      { label: "Locations", href: "/storage", icon: MapPinIcon },
    ],
  },
  {
    label: "Visitors",
    items: [
      { label: "General Inquiries", href: "/public-website", icon: MailIcon, tab: "inquiries" },
      { label: "Visit Requests", href: "/public-website?tab=visits", icon: CalendarIcon, tab: "visits" },
      { label: "QR Exhibits", href: "/exhibits", icon: CubeIcon },
      { label: "FAQ Knowledge", href: "/faq-knowledge", icon: ChatIcon },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Reports", href: "/reports", icon: ChartBarIcon },
      { label: "Audit Log", href: "/audit-logs", icon: ClipboardIcon },
      { label: "Backups", href: "/backup-history", icon: ArchiveIcon },
    ],
  },
  { label: "Admin", items: [{ label: "Users", href: "/users", icon: UsersIcon }] },
];

function SidebarContent({
  collapsed,
  onNavigate,
  headerAction,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  headerAction?: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActive = (item: NavItem) => {
    const path = item.href.split("?")[0];
    if (!pathname.startsWith(path)) return false;
    if (!item.tab) return true;
    const tab = searchParams.get("tab") === "visits" ? "visits" : "inquiries";
    return tab === item.tab;
  };

  return (
    <>
      <div
        className={`flex items-center gap-3 border-b border-black/10 px-5 py-4 ${collapsed ? "lg:justify-center lg:px-3" : "justify-between"}`}
      >
        <Link href="/dashboard" onClick={onNavigate} className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
          <LogoMark className="h-8 w-8 shrink-0 text-forest-700" />
          <span className={`flex flex-col leading-tight ${collapsed ? "lg:hidden" : ""}`}>
            <span className="text-[0.9375rem] font-semibold whitespace-nowrap text-forest-900">
              BioSphere Collections
            </span>
            <span className="text-[0.6875rem] whitespace-nowrap text-zinc-500">
              Curator workspace
            </span>
          </span>
        </Link>
        {headerAction}
      </div>

      <nav aria-label="Curator" className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label ?? "home"} className={groupIndex > 0 ? "mt-3" : ""}>
            {group.label &&
              (collapsed ? (
                <div aria-hidden className="mx-3 mb-2 hidden border-t border-black/10 lg:block" />
              ) : null)}
            {group.label && (
              <p className={`mb-1 px-3 text-xs font-medium text-zinc-500 ${collapsed ? "lg:hidden" : ""}`}>
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-forest-600 ${
                        active
                          ? "bg-forest-100 font-semibold text-forest-900"
                          : "font-medium text-zinc-700 hover:bg-sage-100 hover:text-forest-800"
                      } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                    >
                      <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-forest-700" : "text-zinc-500"}`} />
                      <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={`flex items-center gap-2.5 border-t border-black/10 px-5 py-3 ${collapsed ? "lg:justify-center lg:px-3" : ""}`}
      >
        <LogoMark className="h-8 w-8 shrink-0" />
        <span className={`flex flex-col leading-tight ${collapsed ? "lg:hidden" : ""}`}>
          <span className="text-xs font-semibold whitespace-nowrap text-forest-900">USC Biological Museum</span>
          <span className="text-[0.6875rem] text-zinc-500">v1.0.0</span>
        </span>
      </div>
    </>
  );
}

export function CuratorSidebar({
  mobileOpen,
  onClose,
  collapsed,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
}) {
  return (
    <>
      {/* Desktop rail — always mounted, laid out in normal flow, never a mobile drawer. */}
      <aside
        // overflow-hidden keeps labels from spilling over the page while the width animates.
        className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-black/10 bg-white transition-[width] duration-200 lg:flex ${
          collapsed ? "lg:w-[76px]" : "lg:w-64"
        }`}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile drawer — only mounted while open, so it can never overlap the topbar when closed. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute inset-0 bg-black/30"
          />
          <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <SidebarContent
              collapsed={false}
              onNavigate={onClose}
              headerAction={
                <button type="button" onClick={onClose} aria-label="Close menu" className="shrink-0 text-zinc-500">
                  <CloseIcon className="h-5 w-5" />
                </button>
              }
            />
          </aside>
        </div>
      )}
    </>
  );
}
