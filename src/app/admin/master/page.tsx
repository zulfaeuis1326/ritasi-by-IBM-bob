import { prisma } from "@/lib/prisma";
import MasterDataView from "@/components/admin/MasterDataView";

export default async function AdminMasterPage() {
  const [pits, fleets, haulers, users] = await Promise.all([
    prisma.pit.findMany({ orderBy: { name: "asc" } }),
    prisma.fleet.findMany({
      orderBy: { name: "asc" },
      include: { pit: { select: { name: true, code: true } } },
    }),
    prisma.hauler.findMany({
      orderBy: { unitNumber: "asc" },
      include: {
        fleet: {
          select: {
            name: true,
            code: true,
            pit: { select: { name: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "PENGAWAS" },
      orderBy: { name: "asc" },
      include: { pit: { select: { name: true } } },
    }),
  ]);

  return (
    <MasterDataView
      pits={pits}
      fleets={fleets as any}
      haulers={haulers as any}
      users={users as any}
    />
  );
}
