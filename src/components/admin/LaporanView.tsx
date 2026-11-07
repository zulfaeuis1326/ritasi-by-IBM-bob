"use client";

import { useState } from "react";
import { Search, Download, FileSpreadsheet } from "lucide-react";
import { cn, getMaterialBg, getShiftLabel, formatDate, formatDateTime } from "@/lib/utils";
import type { Material } from "@prisma/client";

interface Pit { id: string; name: string; code: string }
interface Fleet { id: string; name: string; pitId: string; pit: { name: string } }
interface PengawasUser { id: string; name: string }

interface RitasiRow {
  id: string;
  date: string;
  shift: string;
  material: Material;
  trips: number;
  keterangan: string | null;
  hauler: { unitNumber: string; type: string };
  fleet: { name: string };
  pit: { name: string };
  user: { name: string };
  createdAt: string;
}

interface Props {
  pits: Pit[];
  fleets: Fleet[];
  users: PengawasUser[];
}

const SHIFTS = ["PAGI", "SIANG", "MALAM"];
const MATERIALS: Material[] = ["OB", "COAL", "SOIL", "SOLU", "MUD"];

export default function LaporanView({ pits, fleets, users }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [filter, setFilter] = useState({
    dateFrom: today,
    dateTo: today,
    pitId: "",
    fleetId: "",
    shift: "",
    material: "",
    userId: "",
  });
  const [results, setResults] = useState<RitasiRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredFleets = filter.pitId
    ? fleets.filter((f) => f.pitId === filter.pitId)
    : fleets;

  const search = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/admin/laporan?${params}`);
      const data = await res.json();
      setResults(data.ritasis);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results) return;
    const header = "Tanggal,Shift,PIT,Fleet,Unit,Tipe,Material,Trip,Pengawas,Keterangan,Dibuat";
    const rows = results.map((r) =>
      [
        r.date.slice(0, 10),
        r.shift,
        r.pit.name,
        r.fleet.name,
        r.hauler.unitNumber,
        r.hauler.type,
        r.material,
        r.trips,
        r.user.name,
        r.keterangan ?? "",
        formatDateTime(r.createdAt),
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-ritasi-${filter.dateFrom}-${filter.dateTo}.csv`;
    a.click();
  };

  const exportExcel = async () => {
    if (!results) return;
    const XLSX = await import("xlsx");
    const wsData = [
      ["Tanggal", "Shift", "PIT", "Fleet", "Unit", "Tipe", "Material", "Trip", "Pengawas", "Keterangan"],
      ...results.map((r) => [
        r.date.slice(0, 10), r.shift, r.pit.name, r.fleet.name,
        r.hauler.unitNumber, r.hauler.type, r.material, r.trips, r.user.name, r.keterangan ?? "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ritasi");
    XLSX.writeFile(wb, `laporan-ritasi-${filter.dateFrom}-${filter.dateTo}.xlsx`);
  };

  const totalTrips = results?.reduce((s, r) => s + r.trips, 0) ?? 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Filter dan export data ritasi</p>
        </div>

        {/* Filter card */}
        <div className="card p-5 space-y-4">
          <h3 className="font-heading font-semibold text-gray-900">Filter</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="label">Dari Tanggal</label>
              <input type="date" className="input" value={filter.dateFrom} onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label className="label">Sampai Tanggal</label>
              <input type="date" className="input" value={filter.dateTo} onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value }))} />
            </div>
            <div>
              <label className="label">PIT</label>
              <select className="input" value={filter.pitId} onChange={(e) => setFilter((f) => ({ ...f, pitId: e.target.value, fleetId: "" }))}>
                <option value="">Semua PIT</option>
                {pits.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fleet</label>
              <select className="input" value={filter.fleetId} onChange={(e) => setFilter((f) => ({ ...f, fleetId: e.target.value }))}>
                <option value="">Semua Fleet</option>
                {filteredFleets.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Shift</label>
              <select className="input" value={filter.shift} onChange={(e) => setFilter((f) => ({ ...f, shift: e.target.value }))}>
                <option value="">Semua Shift</option>
                {SHIFTS.map((s) => <option key={s} value={s}>{getShiftLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Material</label>
              <select className="input" value={filter.material} onChange={(e) => setFilter((f) => ({ ...f, material: e.target.value }))}>
                <option value="">Semua Material</option>
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pengawas</label>
              <select className="input" value={filter.userId} onChange={(e) => setFilter((f) => ({ ...f, userId: e.target.value }))}>
                <option value="">Semua Pengawas</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={search} disabled={loading} className="btn-primary py-2.5 px-6">
              {loading ? "Mencari..." : (
                <><Search className="h-4 w-4" />Cari Data</>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results !== null && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">{results.length}</span>
                <span className="text-gray-500 text-sm ml-1">baris</span>
                <span className="mx-2 text-gray-300">·</span>
                <span className="font-semibold text-primary-700">{totalTrips.toLocaleString()}</span>
                <span className="text-gray-500 text-sm ml-1">total trip</span>
              </div>
              <div className="flex gap-2">
                <button onClick={exportCSV} className="btn-secondary py-2 text-xs">
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
                <button onClick={exportExcel} className="btn-secondary py-2 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </button>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      {["Tanggal", "Shift", "PIT", "Fleet", "Unit", "Material", "Trip", "Pengawas", "Ket."].map((h) => (
                        <th key={h} className="py-2.5 px-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-xs whitespace-nowrap">{r.date.slice(0, 10)}</td>
                        <td className="py-2.5 px-3 text-xs">{r.shift}</td>
                        <td className="py-2.5 px-3 text-xs">{r.pit.name}</td>
                        <td className="py-2.5 px-3 text-xs">{r.fleet.name}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-xs">{r.hauler.unitNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className={cn("material-badge border", getMaterialBg(r.material))}>{r.material}</span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-primary-700">{r.trips}</td>
                        <td className="py-2.5 px-3 text-xs">{r.user.name}</td>
                        <td className="py-2.5 px-3 text-xs text-gray-400 max-w-32 truncate">{r.keterangan ?? "–"}</td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-400">Tidak ada data untuk filter ini</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
