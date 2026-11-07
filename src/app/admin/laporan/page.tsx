import { prisma } from "@/lib/prisma";
import LaporanView from "@/components/admin/LaporanView";

export default async function LaporanPage() {
  const [pits, fleets, users] = await Promise.all([
    prisma.pit.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.fleet.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { pit: { select: { name: true } } } }),
    prisma.user.findMany({ where: { role: "PENGAWAS", isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <LaporanView
      pits={pits}
      fleets={fleets as any}
      users={users.map((u) => ({ id: u.id, name: u.name }))}
    />
  );
}
