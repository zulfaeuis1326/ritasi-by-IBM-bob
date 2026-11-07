"use client";

import { useRouter } from "next/navigation";
import { LogOut, HardHat, ClipboardList, History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  pit: { id: string; name: string; code: string } | null;
}

export default function PengawasShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/pengawas", label: "Input", icon: ClipboardList },
    { href: "/pengawas/riwayat", label: "Riwayat", icon: History },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Top bar */}
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700">
            <HardHat className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-heading text-sm font-bold text-gray-900 leading-tight">
              {user.name}
            </div>
            <div className="text-xs text-gray-500">
              {user.pit?.name ?? "Semua PIT"}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-surface transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom nav */}
      <nav className="bg-white border-t border-border flex safe-pb">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/pengawas"
              ? pathname === "/pengawas"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors",
                active
                  ? "text-primary-700"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
