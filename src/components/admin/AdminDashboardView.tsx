"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn, getMaterialColor, formatDateTime } from "@/lib/utils";

interface Props {
  stats: {
    todayTrips: number;
    yesterdayTrips: number;
    activeSupervisors: number;
    haulersNoTrips: number;
  };
  dailyTrend: Array<{ date: string; trips: number }>;
  perPitToday: Array<{ pitName: string; trips: number }>;
  perMaterialToday: Array<{ material: string; trips: number }>;
  topHaulers: Array<{
    haulerId: string;
    unitNumber: string;
    type: string;
    fleetName: string;
    pitName: string;
    trips: number;
  }>;
  activePengawas: Array<{
    id: string;
    name: string;
    pitName: string;
    lastShift: string | null;
    lastActive: string | null;
    hasInputToday: boolean;
  }>;
}

function StatCard({
  label,
  value,
  sub,
  trend,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-heading font-bold text-gray-900">
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", color)}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
          ) : trend === "down" ? (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardView({
  stats,
  dailyTrend,
  perPitToday,
  perMaterialToday,
  topHaulers,
  activePengawas,
}: Props) {
  const todayVsYesterday =
    stats.yesterdayTrips > 0
      ? (((stats.todayTrips - stats.yesterdayTrips) / stats.yesterdayTrips) * 100).toFixed(1)
      : "–";

  const trendDir =
    stats.todayTrips > stats.yesterdayTrips
      ? "up"
      : stats.todayTrips < stats.yesterdayTrips
        ? "down"
        : "neutral";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page title */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan operasional hari ini</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Trip Hari Ini"
            value={stats.todayTrips.toLocaleString()}
            sub={`vs kemarin: ${stats.yesterdayTrips.toLocaleString()}`}
            trend={trendDir}
            icon={<span className="text-base font-bold text-white">RT</span>}
            color="bg-primary-700"
          />
          <StatCard
            label="Perubahan"
            value={
              todayVsYesterday !== "–"
                ? `${Number(todayVsYesterday) >= 0 ? "+" : ""}${todayVsYesterday}%`
                : "–"
            }
            sub="dari hari kemarin"
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            color={Number(todayVsYesterday) >= 0 ? "bg-green-600" : "bg-red-500"}
          />
          <StatCard
            label="Pengawas Aktif"
            value={stats.activeSupervisors}
            sub="input hari ini"
            icon={<Users className="h-5 w-5 text-white" />}
            color="bg-violet-600"
          />
          <StatCard
            label="Unit Tanpa Trip"
            value={stats.haulersNoTrips}
            sub="hari ini"
            icon={<AlertTriangle className="h-5 w-5 text-white" />}
            color={stats.haulersNoTrips > 0 ? "bg-amber-500" : "bg-green-600"}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily trend */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-heading font-semibold text-gray-900 mb-4">Tren Trip (30 Hari)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="trips" fill="#1D4ED8" radius={[4, 4, 0, 0]} name="Trip" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per Material pie */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 mb-4">Material Hari Ini</h3>
            {perMaterialToday.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Belum ada data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={perMaterialToday}
                    dataKey="trips"
                    nameKey="material"
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    label={({ material, percent }) =>
                      `${material} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {perMaterialToday.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={getMaterialColor(entry.material)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Per PIT + Top Haulers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Per PIT */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 mb-4">Trip per PIT Hari Ini</h3>
            {perPitToday.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {perPitToday
                  .sort((a, b) => b.trips - a.trips)
                  .map((p) => {
                    const maxTrips = Math.max(...perPitToday.map((x) => x.trips));
                    const pct = maxTrips > 0 ? (p.trips / maxTrips) * 100 : 0;
                    return (
                      <div key={p.pitName}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{p.pitName}</span>
                          <span className="font-bold text-primary-700">{p.trips}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Top haulers */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 mb-4">
              Top 10 Unit (7 Hari)
            </h3>
            <div className="space-y-2">
              {topHaulers.length === 0 && (
                <p className="text-sm text-gray-400">Belum ada data</p>
              )}
              {topHaulers.map((h, idx) => (
                <div key={h.haulerId} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                      idx < 3
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {h.unitNumber}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {h.fleetName} · {h.pitName}
                    </p>
                  </div>
                  <span className="font-heading font-bold text-primary-700 text-sm">
                    {h.trips}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active pengawas */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">
            Status Pengawas Hari Ini
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium text-gray-500 pr-4">Nama</th>
                  <th className="pb-2 font-medium text-gray-500 pr-4">PIT</th>
                  <th className="pb-2 font-medium text-gray-500 pr-4">Shift Terakhir</th>
                  <th className="pb-2 font-medium text-gray-500 pr-4">Terakhir Aktif</th>
                  <th className="pb-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activePengawas.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{p.pitName}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{p.lastShift ?? "–"}</td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {p.lastActive ? formatDateTime(p.lastActive) : "–"}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        {p.hasInputToday ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-medium",
                            p.hasInputToday ? "text-green-600" : "text-gray-400"
                          )}
                        >
                          {p.hasInputToday ? "Aktif" : "Belum"}
                        </span>
                      </div>
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
