import { prisma } from "@/lib/prisma";
import AdminDashboardView from "@/components/admin/AdminDashboardView";
import { startOfDay, subDays } from "date-fns";

export default async function AdminDashboard() {
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  const last7 = subDays(today, 7);
  const last30 = subDays(today, 30);

  // ─── Stats today ──────────────────────────────────────────────────────────
  const [todayTotal, yesterdayTotal, pits, activeSupervisors] = await Promise.all([
    prisma.ritasi.aggregate({
      where: { date: today },
      _sum: { trips: true },
    }),
    prisma.ritasi.aggregate({
      where: { date: yesterday },
      _sum: { trips: true },
    }),
    prisma.pit.findMany({
      where: { isActive: true },
      include: {
        ritasis: {
          where: { date: today },
          select: { trips: true },
        },
      },
    }),
    prisma.user.count({
      where: {
        role: "PENGAWAS",
        isActive: true,
        ritasis: { some: { date: today } },
      },
    }),
  ]);

  // ─── Daily trend (30 days) ──────────────────────────────────────────────
  const dailyRaw = await prisma.ritasi.groupBy({
    by: ["date"],
    where: { date: { gte: last30 } },
    _sum: { trips: true },
    orderBy: { date: "asc" },
  });

  // ─── Per PIT today ─────────────────────────────────────────────────────
  const perPitToday = await prisma.ritasi.groupBy({
    by: ["pitId"],
    where: { date: today },
    _sum: { trips: true },
  });

  // ─── Per material today ────────────────────────────────────────────────
  const perMaterialToday = await prisma.ritasi.groupBy({
    by: ["material"],
    where: { date: today },
    _sum: { trips: true },
  });

  // ─── Top haulers (7 days) ──────────────────────────────────────────────
  const topHaulersRaw = await prisma.ritasi.groupBy({
    by: ["haulerId"],
    where: { date: { gte: last7 } },
    _sum: { trips: true },
    orderBy: { _sum: { trips: "desc" } },
    take: 10,
  });

  const topHaulerIds = topHaulersRaw.map((h) => h.haulerId);
  const haulerDetails = await prisma.hauler.findMany({
    where: { id: { in: topHaulerIds } },
    include: { fleet: { include: { pit: true } } },
  });

  const topHaulers = topHaulersRaw.map((h) => {
    const detail = haulerDetails.find((d) => d.id === h.haulerId);
    return {
      haulerId: h.haulerId,
      unitNumber: detail?.unitNumber ?? "?",
      type: detail?.type ?? "",
      fleetName: detail?.fleet.name ?? "",
      pitName: detail?.fleet.pit.name ?? "",
      trips: h._sum.trips ?? 0,
    };
  });

  // ─── Monitoring pengawas aktif ─────────────────────────────────────────
  const activePengawas = await prisma.user.findMany({
    where: { role: "PENGAWAS", isActive: true },
    include: {
      pit: { select: { name: true } },
      ritasis: {
        where: { date: today },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { updatedAt: true, shift: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // ─── Anomaly: haulers with 0 trips today ──────────────────────────────
  const allHaulers = await prisma.hauler.count({ where: { isActive: true } });
  const haulersWithTrips = await prisma.ritasi.groupBy({
    by: ["haulerId"],
    where: { date: today, trips: { gt: 0 } },
  });
  const haulersNoTrips = allHaulers - haulersWithTrips.length;

  const pitMap = new Map(pits.map((p) => [p.id, p.name]));

  return (
    <AdminDashboardView
      stats={{
        todayTrips: todayTotal._sum.trips ?? 0,
        yesterdayTrips: yesterdayTotal._sum.trips ?? 0,
        activeSupervisors,
        haulersNoTrips,
      }}
      dailyTrend={dailyRaw.map((d) => ({
        date: d.date.toISOString().slice(0, 10),
        trips: d._sum.trips ?? 0,
      }))}
      perPitToday={perPitToday.map((p) => ({
        pitName: pitMap.get(p.pitId) ?? p.pitId,
        trips: p._sum.trips ?? 0,
      }))}
      perMaterialToday={perMaterialToday.map((m) => ({
        material: m.material,
        trips: m._sum.trips ?? 0,
      }))}
      topHaulers={topHaulers}
      activePengawas={activePengawas.map((u) => ({
        id: u.id,
        name: u.name,
        pitName: u.pit?.name ?? "–",
        lastShift: u.ritasis[0]?.shift ?? null,
        lastActive: u.ritasis[0]?.updatedAt?.toISOString() ?? null,
        hasInputToday: u.ritasis.length > 0,
      }))}
    />
  );
}
