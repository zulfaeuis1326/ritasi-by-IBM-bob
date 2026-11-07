"use client";

import { useState, useCallback } from "react";
import { Share2, Download, Loader2, CheckCircle2, AlertCircle, Truck } from "lucide-react";
import { cn, getMaterialBg, getShiftLabel, buildWhatsAppMessage, formatDate } from "@/lib/utils";
import type { Shift, Material } from "@prisma/client";

const MATERIALS: Material[] = ["OB", "COAL", "SOIL", "SOLU", "MUD"];

const MATERIAL_LABELS: Record<Material, string> = {
  OB: "Over Burden",
  COAL: "Batubara",
  SOIL: "Tanah",
  SOLU: "Solution",
  MUD: "Lumpur",
};

const SHIFT_COLORS: Record<string, string> = {
  PAGI:  "bg-amber-50 text-amber-700 border-amber-200",
  SIANG: "bg-orange-50 text-orange-700 border-orange-200",
  MALAM: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

type RitasiEntry = {
  id?: string;
  haulerId: string;
  material: Material;
  trips: number;
  ritasiTime?: string | null;
  keterangan?: string | null;
};

interface HaulerData {
  id: string;
  unitNumber: string;
  type: string;
}

interface FleetData {
  id: string;
  name: string;
  code: string;
  haulers: HaulerData[];
}

interface PitData {
  id: string;
  name: string;
  code: string;
  fleets: FleetData[];
}

interface ExistingRitasi {
  id: string;
  haulerId: string;
  material: Material;
  trips: number;
  ritasiTime: Date | null;
  keterangan: string | null;
}

interface Props {
  pit: PitData;
  shift: Shift;
  userId: string;
  existingRitasis: ExistingRitasi[];
  today: string;
}

export default function RitasiInputPage({ pit, shift, existingRitasis, today }: Props) {
  const initEntries = () => {
    const map = new Map<string, Map<Material, RitasiEntry>>();
    for (const r of existingRitasis) {
      if (!map.has(r.haulerId)) map.set(r.haulerId, new Map());
      map.get(r.haulerId)!.set(r.material, {
        id: r.id,
        haulerId: r.haulerId,
        material: r.material,
        trips: r.trips,
        ritasiTime: r.ritasiTime ? new Date(r.ritasiTime).toTimeString().slice(0, 5) : null,
        keterangan: r.keterangan,
      });
    }
    return map;
  };

  const [entries, setEntries] = useState<Map<string, Map<Material, RitasiEntry>>>(initEntries);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const getEntry = (haulerId: string, material: Material): RitasiEntry =>
    entries.get(haulerId)?.get(material) ?? { haulerId, material, trips: 0 };

  const updateTrips = useCallback(
    async (haulerId: string, material: Material, delta: number) => {
      const key = `${haulerId}:${material}`;
      const current = getEntry(haulerId, material);
      const newTrips = Math.max(0, current.trips + delta);

      setEntries((prev) => {
        const next = new Map(prev);
        if (!next.has(haulerId)) next.set(haulerId, new Map());
        const haulerMap = new Map(next.get(haulerId)!);
        haulerMap.set(material, { ...current, trips: newTrips });
        next.set(haulerId, haulerMap);
        return next;
      });

      setSaving((s) => new Set(s).add(key));

      try {
        const res = await fetch("/api/ritasi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ haulerId, material, trips: newTrips, shift, date: today.slice(0, 10) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");

        setEntries((prev) => {
          const next = new Map(prev);
          if (!next.has(haulerId)) next.set(haulerId, new Map());
          const haulerMap = new Map(next.get(haulerId)!);
          haulerMap.set(material, { ...data.ritasi, trips: newTrips });
          next.set(haulerId, haulerMap);
          return next;
        });
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Error", "error");
        setEntries((prev) => {
          const next = new Map(prev);
          const haulerMap = new Map(next.get(haulerId) ?? new Map());
          haulerMap.set(material, current);
          next.set(haulerId, haulerMap);
          return next;
        });
      } finally {
        setSaving((s) => { const n = new Set(s); n.delete(key); return n; });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, shift, today]
  );

  const totalTrips = () => {
    let t = 0;
    entries.forEach((m) => m.forEach((e) => (t += e.trips)));
    return t;
  };

  const handleWhatsApp = () => {
    const rows: Array<{ unit: string; fleet: string; material: string; trips: number }> = [];
    pit.fleets.forEach((fleet) =>
      fleet.haulers.forEach((h) => {
        entries.get(h.id)?.forEach((entry, mat) => {
          if (entry.trips > 0) rows.push({ unit: h.unitNumber, fleet: fleet.name, material: mat, trips: entry.trips });
        });
      })
    );
    window.open(`https://wa.me/?text=${buildWhatsAppMessage(pit.name, shift, formatDate(today), rows)}`, "_blank");
  };

  const handleCSV = () => {
    const lines = ["Unit,Fleet,Material,Trip,Shift,Tanggal"];
    pit.fleets.forEach((fleet) =>
      fleet.haulers.forEach((h) => {
        entries.get(h.id)?.forEach((entry, mat) => {
          if (entry.trips > 0)
            lines.push(`${h.unitNumber},${fleet.name},${mat},${entry.trips},${shift},${today.slice(0, 10)}`);
        });
      })
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `rekap-${pit.code}-${shift}-${today.slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                {formatDate(today)}
              </p>
              <h2 className="font-heading text-lg font-bold text-gray-900 leading-tight">
                {pit.name}
              </h2>
              <span className={cn(
                "inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                SHIFT_COLORS[shift]
              )}>
                {getShiftLabel(shift)}
              </span>
            </div>
            {/* Total counter */}
            <div className="flex flex-col items-center justify-center bg-primary-700 rounded-2xl px-4 py-2 min-w-[64px]">
              <span className="font-heading text-2xl font-black text-white leading-none">
                {totalTrips()}
              </span>
              <span className="text-[10px] text-primary-200 font-medium mt-0.5">TRIP</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 active:scale-95 transition-transform"
            >
              <Share2 className="h-3.5 w-3.5" />
              Bagikan WA
            </button>
            <button
              onClick={handleCSV}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-gray-600 active:scale-95 transition-transform"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Fleet sections ── */}
      <div className="flex-1 px-4 pb-28 space-y-5 pt-4">
        {pit.fleets.map((fleet) => {
          const fleetTotal = fleet.haulers.reduce((sum, h) => {
            let t = 0;
            entries.get(h.id)?.forEach((e) => (t += e.trips));
            return sum + t;
          }, 0);

          return (
            <div key={fleet.id}>
              {/* Fleet label */}
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-700" />
                  <h3 className="font-heading text-sm font-bold text-gray-700 uppercase tracking-wide">
                    {fleet.name}
                  </h3>
                  <span className="text-xs text-gray-400">{fleet.haulers.length} unit</span>
                </div>
                {fleetTotal > 0 && (
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-2.5 py-0.5">
                    {fleetTotal} trip
                  </span>
                )}
              </div>

              {/* Hauler cards */}
              <div className="space-y-3">
                {fleet.haulers.map((hauler) => {
                  const haulerTotal = [...(entries.get(hauler.id)?.values() ?? [])].reduce(
                    (s, e) => s + e.trips, 0
                  );
                  const unitSuffix = hauler.unitNumber.split("-")[1] ?? hauler.unitNumber.slice(-3);

                  return (
                    <div
                      key={hauler.id}
                      className={cn(
                        "rounded-2xl border bg-white overflow-hidden transition-shadow",
                        haulerTotal > 0 ? "border-primary-200 shadow-sm" : "border-border"
                      )}
                    >
                      {/* Card header */}
                      <div className={cn(
                        "flex items-center justify-between px-4 py-3",
                        haulerTotal > 0 ? "bg-primary-50" : "bg-gray-50"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center",
                            haulerTotal > 0 ? "bg-primary-700" : "bg-gray-200"
                          )}>
                            {haulerTotal > 0
                              ? <span className="font-heading text-sm font-black text-white">{unitSuffix}</span>
                              : <Truck className="h-4 w-4 text-gray-500" />
                            }
                          </div>
                          <div>
                            <p className="font-heading font-bold text-sm text-gray-900">{hauler.unitNumber}</p>
                            <p className="text-xs text-gray-400">{hauler.type}</p>
                          </div>
                        </div>
                        {haulerTotal > 0 && (
                          <div className="text-right">
                            <p className="font-heading text-xl font-black text-primary-700 leading-none">{haulerTotal}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">trip</p>
                          </div>
                        )}
                      </div>

                      {/* Material counters */}
                      <div className="px-3 py-3 grid grid-cols-1 gap-2">
                        {MATERIALS.map((mat) => {
                          const entry = getEntry(hauler.id, mat);
                          const key = `${hauler.id}:${mat}`;
                          const isSaving = saving.has(key);

                          return (
                            <MaterialCard
                              key={mat}
                              material={mat}
                              entry={entry}
                              isSaving={isSaving}
                              onAdd={() => updateTrips(hauler.id, mat, 1)}
                              onSub={() => updateTrips(hauler.id, mat, -1)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl",
          "transition-all duration-300",
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        )}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Material Card ── */
function MaterialCard({
  material,
  entry,
  isSaving,
  onAdd,
  onSub,
}: {
  material: Material;
  entry: RitasiEntry;
  isSaving: boolean;
  onAdd: () => void;
  onSub: () => void;
}) {
  const hasTrips = entry.trips > 0;

  return (
    <div className={cn(
      "flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors",
      hasTrips ? "bg-gray-50 border border-gray-100" : "bg-white border border-gray-100"
    )}>
      {/* Material label */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={cn(
          "material-badge border shrink-0",
          getMaterialBg(material)
        )}>
          {material}
        </span>
        <span className="text-xs text-gray-500 truncate">{MATERIAL_LABELS[material]}</span>
      </div>

      {/* Counter controls */}
      <div className="flex items-center gap-2 shrink-0">
        {isSaving && <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />}

        {/* − button */}
        <button
          onClick={onSub}
          disabled={entry.trips === 0 || isSaving}
          className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center font-bold transition-all active:scale-90",
            entry.trips === 0
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100"
          )}
          aria-label="Kurangi trip"
        >
          <span className="text-lg leading-none select-none">−</span>
        </button>

        {/* Trip count */}
        <span className={cn(
          "w-9 text-center font-heading text-xl font-black tabular-nums transition-colors",
          hasTrips ? "text-primary-700" : "text-gray-300"
        )}>
          {entry.trips}
        </span>

        {/* + button */}
        <button
          onClick={onAdd}
          disabled={isSaving}
          className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary-700 text-white hover:bg-primary-800 active:scale-90 transition-all disabled:opacity-50"
          aria-label="Tambah trip"
        >
          <span className="text-lg leading-none select-none">+</span>
        </button>
      </div>
    </div>
  );
}
