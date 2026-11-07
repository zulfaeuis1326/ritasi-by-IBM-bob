"use client";

import { useState } from "react";
import { formatDateTime, getMaterialBg, cn } from "@/lib/utils";
import { CheckCircle2, Circle, ChevronDown } from "lucide-react";

interface RitasiRecord {
  id: string;
  shift: string;
  material: string;
  trips: number;
  updatedAt: string;
  hauler: { unitNumber: string };
  fleet: { name: string };
}

interface PengawasData {
  id: string;
  name: string;
  username: string;
  isActive: boolean;
  pit: { name: string; code: string } | null;
  todayRitasis: RitasiRecord[];
}

interface Props {
  users: PengawasData[];
  today: string;
}

export default function PengawasMonitorView({ users, today }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const active = users.filter((u) => u.isActive);
  const inputToday = active.filter((u) => u.todayRitasis.length > 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Monitor Pengawas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(today).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Pengawas Aktif", value: active.length, color: "bg-primary-50 text-primary-700" },
            { label: "Sudah Input Hari Ini", value: inputToday.length, color: "bg-green-50 text-green-700" },
            { label: "Belum Input", value: active.length - inputToday.length, color: "bg-amber-50 text-amber-700" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className={cn("text-3xl font-heading font-bold", s.color)}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* User list */}
        <div className="space-y-3">
          {users.map((u) => {
            const hasInput = u.todayRitasis.length > 0;
            const totalTrips = u.todayRitasis.reduce((s, r) => s + r.trips, 0);
            const lastActive = u.todayRitasis[0]?.updatedAt ?? null;

            return (
              <div key={u.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded((e) => e === u.id ? null : u.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {hasInput ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    )}
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-400">
                        @{u.username} · {u.pit?.name ?? "Semua PIT"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasInput ? (
                      <div className="text-right">
                        <div className="font-heading font-bold text-primary-700">{totalTrips} trip</div>
                        <div className="text-xs text-gray-400">{lastActive ? formatDateTime(lastActive) : ""}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Belum input</span>
                    )}
                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", expanded === u.id && "rotate-180")} />
                  </div>
                </button>

                {expanded === u.id && u.todayRitasis.length > 0 && (
                  <div className="border-t border-border bg-gray-50 p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="text-left pb-2 pr-3">Unit</th>
                          <th className="text-left pb-2 pr-3">Fleet</th>
                          <th className="text-left pb-2 pr-3">Shift</th>
                          <th className="text-left pb-2 pr-3">Material</th>
                          <th className="text-right pb-2 pr-3">Trip</th>
                          <th className="text-right pb-2">Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {u.todayRitasis.map((r) => (
                          <tr key={r.id}>
                            <td className="py-1.5 pr-3 font-mono font-semibold">{r.hauler.unitNumber}</td>
                            <td className="py-1.5 pr-3">{r.fleet.name}</td>
                            <td className="py-1.5 pr-3">{r.shift}</td>
                            <td className="py-1.5 pr-3">
                              <span className={cn("material-badge border", getMaterialBg(r.material as any))}>{r.material}</span>
                            </td>
                            <td className="py-1.5 pr-3 text-right font-bold text-primary-700">{r.trips}</td>
                            <td className="py-1.5 text-right text-gray-400">{formatDateTime(r.updatedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
