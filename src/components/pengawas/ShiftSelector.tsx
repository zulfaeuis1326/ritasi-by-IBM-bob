"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Sunset, Moon, ChevronRight } from "lucide-react";
import { cn, getCurrentShift } from "@/lib/utils";

interface Pit {
  id: string;
  name: string;
  code: string;
}

const SHIFTS = [
  {
    key: "PAGI",
    label: "Shift Pagi",
    time: "07:00 – 15:00",
    icon: Sun,
    color: "border-amber-300 bg-amber-50 text-amber-700",
    activeColor: "border-amber-500 bg-amber-100",
  },
  {
    key: "SIANG",
    label: "Shift Siang",
    time: "15:00 – 23:00",
    icon: Sunset,
    color: "border-orange-300 bg-orange-50 text-orange-700",
    activeColor: "border-orange-500 bg-orange-100",
  },
  {
    key: "MALAM",
    label: "Shift Malam",
    time: "23:00 – 07:00",
    icon: Moon,
    color: "border-indigo-300 bg-indigo-50 text-indigo-700",
    activeColor: "border-indigo-500 bg-indigo-100",
  },
] as const;

export default function ShiftSelector({ pits }: { pits: Pit[] }) {
  const router = useRouter();
  const currentShift = getCurrentShift();
  const [selectedPit, setSelectedPit] = useState(pits[0]?.id ?? "");
  const [selectedShift, setSelectedShift] = useState<string>(currentShift);

  const handleGo = () => {
    if (!selectedPit || !selectedShift) return;
    router.push(`/pengawas/${selectedPit}/${selectedShift.toLowerCase()}`);
  };

  return (
    <div className="mt-4 space-y-5">
      {/* PIT selector */}
      {pits.length > 1 && (
        <div>
          <p className="label">Pilih PIT</p>
          <div className="grid grid-cols-2 gap-3">
            {pits.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPit(p.id)}
                className={cn(
                  "tap-btn border-2 transition-all",
                  selectedPit === p.id
                    ? "border-primary-700 bg-primary-50 text-primary-700"
                    : "border-border bg-white text-gray-600"
                )}
              >
                <span className="text-2xl font-heading font-bold">{p.code}</span>
                <span className="text-xs mt-1">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pits.length === 1 && (
        <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
          <p className="text-xs font-medium text-primary-700">PIT Ditugaskan</p>
          <p className="font-heading font-bold text-primary-900 mt-0.5">
            {pits[0].name}
          </p>
        </div>
      )}

      {/* Shift selector */}
      <div>
        <p className="label">Pilih Shift</p>
        <div className="space-y-3">
          {SHIFTS.map(({ key, label, time, icon: Icon, color, activeColor }) => (
            <button
              key={key}
              onClick={() => setSelectedShift(key)}
              className={cn(
                "w-full tap-btn flex-row justify-between border-2 transition-all",
                selectedShift === key ? activeColor : `${color} opacity-80`
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold text-base">{label}</div>
                  <div className="text-xs opacity-75">{time}</div>
                </div>
              </div>
              {key === currentShift && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 border">
                  Sekarang
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Go button */}
      <button
        onClick={handleGo}
        disabled={!selectedPit || !selectedShift}
        className="btn-primary w-full text-base py-4 mt-2"
      >
        Mulai Catat Ritasi
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
