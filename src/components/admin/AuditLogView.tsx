"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";

interface Log {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  oldValue: Prisma.JsonValue;
  newValue: Prisma.JsonValue;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; username: string };
}

const ACTION_STYLES: Record<AuditAction, string> = {
  CREATE: "bg-green-50 text-green-700 border-green-200",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  DELETE: "bg-red-50 text-red-600 border-red-200",
  LOGIN: "bg-gray-50 text-gray-600 border-gray-200",
  LOGOUT: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function AuditLogView({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const filtered = logs.filter((l) => {
    const matchSearch =
      !search ||
      l.user.name.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      (l.entityId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "ALL" || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">500 log terbaru — semua perubahan data tercatat</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Cari user, entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-40"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  {["Waktu", "User", "Aksi", "Entitas", "ID", "IP", "Detail"].map((h) => (
                    <th key={h} className="py-2.5 pr-4 pl-2 text-left text-xs font-semibold text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                      Tidak ada data
                    </td>
                  </tr>
                )}
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 pl-2 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                      {log.user.name}
                      <span className="ml-1 text-xs text-gray-400">@{log.user.username}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold", ACTION_STYLES[log.action])}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-700">{log.entity}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-400 max-w-24 truncate">
                      {log.entityId ? log.entityId.slice(-8) : "–"}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-400">{log.ipAddress ?? "–"}</td>
                    <td className="py-2.5 pr-2">
                      {(log.oldValue || log.newValue) && (
                        <details className="cursor-pointer">
                          <summary className="text-xs text-primary-700 hover:underline list-none">
                            Lihat
                          </summary>
                          <div className="absolute z-10 mt-1 max-w-xs rounded-xl border border-border bg-white p-3 shadow-card-hover text-xs">
                            {log.oldValue && (
                              <div className="mb-2">
                                <span className="font-semibold text-red-600">Sebelum:</span>
                                <pre className="mt-1 text-gray-600 whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.oldValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <span className="font-semibold text-green-600">Sesudah:</span>
                                <pre className="mt-1 text-gray-600 whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.newValue, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
