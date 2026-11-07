"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  ClipboardList,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HardHat,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/master", label: "Master Data", icon: Database },
  { href: "/admin/pengawas", label: "Pengawas", icon: Users },
  { href: "/admin/audit", label: "Audit Log", icon: ClipboardList },
];

export default function AdminShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-border transition-all duration-200 sticky top-0 h-screen",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-primary-700">
            <HardHat className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-gray-900 text-sm truncate">
              RitasiCounter
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  collapsed && "justify-center"
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-3 space-y-2">
          {!collapsed && (
            <div className="px-2 py-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Keluar" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && "Keluar"}
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center justify-center w-full rounded-lg border border-border py-1.5 text-xs text-gray-400 hover:bg-surface transition-colors"
            title={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary-700">
            <HardHat className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="font-heading font-bold text-sm">Admin</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500">
          Keluar
        </button>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-border flex">
        {NAV_ITEMS.slice(0, 4).map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium",
                active ? "text-primary-700" : "text-gray-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col md:pt-0 pt-14 pb-16 md:pb-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
