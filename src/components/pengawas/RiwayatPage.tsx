"use client";

import { useState } from "react";
import { Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { cn, getMaterialBg, formatDate, formatDateTime, getShiftLabel } from "@/lib/utils";
import type { Material } from "@prisma/client";

interface RitasiItem {
  id: string;
  material: Material;
  trips: number;
  keterangan: string | null;
  date: Date;
  shift: string;
  ritasiTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  hauler: { id: string; unitNumber: string; type: string };
  fleet: { id: string; name: string; code: string };
  pit: { id: string; name: string; code: string };
}

interface Props {
  ritasis: RitasiItem[];
  userId: string;
}

export default function RiwayatPage({ ritasis: initial }: Props) {
  const [ritasis, setRitasis] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    trips: number;
    keterangan: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const startEdit = (r: RitasiItem) => {
    setEditingId(r.id);
    setEditForm({ trips: r.trips, keterangan: r.keterangan ?? "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async (id: string) => {
    if (!editForm) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ritasi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal update");

      setRitasis((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...editForm, updatedAt: new Date() } : r
        )
      );
      showToast("Berhasil diupdate");
      cancelEdit();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Hapus data ritasi ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ritasi/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal hapus");
      }
      setRitasis((prev) => prev.filter((r) => r.id !== id));
      showToast("Data dihapus");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  // Group by date
  const grouped = new Map<string, RitasiItem[]>();
  for (const r of ritasis) {
    const key = new Date(r.date).toISOString().slice(0, 10);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }
  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-6 pb-2">
        <h1 className="font-heading text-xl font-bold text-gray-900">Riwayat Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">7 hari terakhir</p>
      </div>

      {ritasis.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <span className="text-3xl">📋</span>
          </div>
          <p className="font-semibold text-gray-700">Belum ada data</p>
          <p className="text-sm text-gray-400 mt-1">Mulai catat ritasi dari tab Input</p>
        </div>
      )}

      <div className="flex-1 px-4 pb-6 space-y-6 mt-2">
        {sortedDates.map((dateKey) => {
          const items = grouped.get(dateKey)!;
          return (
            <div key={dateKey}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {formatDate(dateKey)}
              </h3>
              <div className="space-y-2">
                {items.map((r) => (
                  <div key={r.id} className="card px-4 py-3">
                    {editingId === r.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{r.hauler.unitNumber}</span>
                            <span className={cn("material-badge border text-xs", getMaterialBg(r.material))}>
                              {r.material}
                            </span>
                          </div>
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <label className="label">Trip</label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                setEditForm((f) => f && { ...f, trips: Math.max(0, f.trips - 1) })
                              }
                              className="h-10 w-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={999}
                              value={editForm?.trips ?? 0}
                              onChange={(e) =>
                                setEditForm((f) =>
                                  f ? { ...f, trips: parseInt(e.target.value) || 0 } : f
                                )
                              }
                              className="input text-center w-20"
                            />
                            <button
                              onClick={() =>
                                setEditForm((f) => f && { ...f, trips: f.trips + 1 })
                              }
                              className="h-10 w-10 rounded-lg bg-primary-700 text-white flex items-center justify-center font-bold text-lg"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="label">Keterangan</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="Opsional"
                            value={editForm?.keterangan ?? ""}
                            onChange={(e) =>
                              setEditForm((f) => f ? { ...f, keterangan: e.target.value } : f)
                            }
                          />
                        </div>
                        <button
                          onClick={() => saveEdit(r.id)}
                          disabled={loading}
                          className="btn-primary w-full"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Simpan
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-gray-900">
                              {r.hauler.unitNumber}
                            </span>
                            <span className={cn("material-badge border", getMaterialBg(r.material))}>
                              {r.material}
                            </span>
                            <span className="text-xs text-gray-400">{getShiftLabel(r.shift)}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span>{r.fleet.name}</span>
                            <span>·</span>
                            <span>{r.pit.name}</span>
                          </div>
                          {r.keterangan && (
                            <p className="mt-1 text-xs text-gray-500 italic">"{r.keterangan}"</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDateTime(r.updatedAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-2xl font-heading font-bold text-primary-700">
                            {r.trips}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(r)}
                              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-primary-700 hover:border-primary-300"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteItem(r.id)}
                              disabled={loading}
                              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div
          className={cn(
            "fixed bottom-20 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg z-50",
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
