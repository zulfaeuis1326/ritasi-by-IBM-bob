import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ShiftSelector from "@/components/pengawas/ShiftSelector";
import { formatDate } from "@/lib/utils";

async function getAvailablePits(pitId: string | null) {
  if (pitId) {
    const pit = await prisma.pit.findUnique({ where: { id: pitId } });
    return pit ? [pit] : [];
  }
  // Admin-like pengawas: can see all pits
  return prisma.pit.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export default async function PengawasDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) redirect("/login");

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { pit: true } } },
  });
  if (!session) redirect("/login");

  const pits = await getAvailablePits(session.user.pitId);
  const today = formatDate(new Date());

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-6 pb-2">
        <h1 className="font-heading text-xl font-bold text-gray-900">
          Pilih Shift & PIT
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{today}</p>
      </div>
      <div className="flex-1 px-4 pb-6">
        <ShiftSelector pits={pits} />
      </div>
    </div>
  );
}
