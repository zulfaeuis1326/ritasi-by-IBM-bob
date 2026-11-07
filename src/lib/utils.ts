import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getShiftLabel(shift: string): string {
  const map: Record<string, string> = {
    PAGI: "Pagi (07:00–15:00)",
    SIANG: "Siang (15:00–23:00)",
    MALAM: "Malam (23:00–07:00)",
  };
  return map[shift] ?? shift;
}

export function getMaterialColor(material: string): string {
  const map: Record<string, string> = {
    OB: "#F59E0B",
    COAL: "#1F2937",
    SOIL: "#92400E",
    SOLU: "#0EA5E9",
    MUD: "#65A30D",
  };
  return map[material] ?? "#6B7280";
}

export function getMaterialBg(material: string): string {
  const map: Record<string, string> = {
    OB: "bg-amber-100 text-amber-800 border-amber-200",
    COAL: "bg-gray-800 text-white border-gray-700",
    SOIL: "bg-amber-900/20 text-amber-900 border-amber-800/20",
    SOLU: "bg-sky-100 text-sky-800 border-sky-200",
    MUD: "bg-lime-100 text-lime-800 border-lime-200",
  };
  return map[material] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export function getCurrentShift(): "PAGI" | "SIANG" | "MALAM" {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 15) return "PAGI";
  if (hour >= 15 && hour < 23) return "SIANG";
  return "MALAM";
}

export function buildWhatsAppMessage(
  pit: string,
  shift: string,
  date: string,
  rows: Array<{ unit: string; fleet: string; material: string; trips: number }>
): string {
  const header = `*REKAP RITASI*\n📍 ${pit}\n🕐 Shift ${shift} – ${date}\n\n`;
  const body = rows
    .map(
      (r, i) =>
        `${i + 1}. *${r.unit}* (${r.fleet})\n   ${r.material}: ${r.trips} trip`
    )
    .join("\n");
  const total = rows.reduce((s, r) => s + r.trips, 0);
  const footer = `\n\n*Total: ${total} trip*`;
  return encodeURIComponent(header + body + footer);
}
