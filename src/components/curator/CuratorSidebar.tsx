"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { LogoMark } from "@/components/layout/LogoMark";
import {
  HierarchyIcon,
  PawIcon,
  DocumentTextIcon,
  MapPinIcon,
  CubeIcon,
  ClipboardIcon,
  GlobeIcon,
  UsersIcon,
  ChartBarIcon,
  CloseIcon,
  ChevronLeftIcon,
} from "@/components/icons";

const NAV_ITEMS: { label: string; href: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { label: "Dashboard", href: "/dashboard", icon: HierarchyIcon },
  { label: "Specimen", href: "/specimens", icon: PawIcon },
  { label: "Cataloging", href: "/cataloging", icon: DocumentTextIcon },
  { label: "Location", href: "/storage", icon: MapPinIcon },
  { label: "QR Exhibits", href: "/exhibits", icon: CubeIcon },
  { label: "Audit Logs", href: "/audit-logs", icon: ClipboardIcon },
  { label: "Public Website", href: "/", icon: GlobeIcon },
  { label: "User", href: "/account", icon: UsersIcon },
  { label: "Reports", href: "/reports", icon: ChartBarIcon },
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
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <div
        className={`flex items-center gap-3 border-b border-black/10 px-5 py-5 ${collapsed ? "lg:justify-center lg:px-3" : "justify-between"}`}
      >
        <Link href="/dashboard" onClick={onNavigate} className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
          <LogoMark className="h-8 w-8 shrink-0 text-forest-700" />
          <span className={`flex flex-col leading-tight ${collapsed ? "lg:hidden" : ""}`}>
            <span className="text-[15px] font-semibold whitespace-nowrap text-forest-900">
              BioSphere Inventory
            </span>
            <span className="text-[11px] whitespace-nowrap text-zinc-500">
              USC Biological Museum Curator Dashboard
            </span>
          </span>
        </Link>
        {headerAction}
      </div>

      <nav aria-label="Curator" className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-forest-700 text-white"
                      : "text-zinc-700 hover:bg-sage-100 hover:text-forest-800"
                  } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={`flex items-center gap-2.5 border-t border-black/10 px-5 py-4 ${collapsed ? "lg:justify-center lg:px-3" : ""}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <LogoMark className="h-4.5 w-4.5" />
        </span>
        <span className={`flex flex-col leading-tight ${collapsed ? "lg:hidden" : ""}`}>
          <span className="text-xs font-semibold whitespace-nowrap text-forest-900">USC Biological Museum</span>
          <span className="text-[11px] text-zinc-500">v1.0.0</span>
        </span>
      </div>
    </>
  );
}

export function CuratorSidebar({
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <>
      {/* Desktop rail — always mounted, laid out in normal flow, never a mobile drawer. */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-black/10 bg-white transition-[width] duration-200 lg:flex ${
          collapsed ? "lg:w-[76px]" : "lg:w-64"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          headerAction={
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={collapsed ? "lg:hidden" : "shrink-0 text-zinc-500 hover:text-forest-700"}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          }
        />
        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="hidden items-center justify-center gap-2 border-t border-black/10 px-5 py-2.5 text-zinc-500 hover:bg-sage-100 hover:text-forest-800 lg:flex"
          >
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        )}
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
