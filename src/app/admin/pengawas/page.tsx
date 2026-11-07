import { prisma } from "@/lib/prisma";
import PengawasMonitorView from "@/components/admin/PengawasMonitorView";
import { startOfDay } from "date-fns";

export default async function AdminPengawasPage() {
  const today = startOfDay(new Date());

  const users = await prisma.user.findMany({
    where: { role: "PENGAWAS" },
    orderBy: { name: "asc" },
    include: {
      pit: { select: { name: true, code: true } },
      ritasis: {
        where: { date: today },
        select: {
          id: true,
          shift: true,
          material: true,
          trips: true,
          updatedAt: true,
          hauler: { select: { unitNumber: true } },
          fleet: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return (
    <PengawasMonitorView
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        isActive: u.isActive,
        pit: u.pit,
        todayRitasis: u.ritasis.map((r) => ({
          ...r,
          updatedAt: r.updatedAt.toISOString(),
        })),
      }))}
      today={today.toISOString()}
    />
  );
}
