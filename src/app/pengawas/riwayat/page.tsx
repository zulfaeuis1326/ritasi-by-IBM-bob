import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RiwayatPage from "@/components/pengawas/RiwayatPage";

export default async function PengawasRiwayat() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) redirect("/login");

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) redirect("/login");

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  last7Days.setHours(0, 0, 0, 0);

  const ritasis = await prisma.ritasi.findMany({
    where: {
      userId: session.userId,
      date: { gte: last7Days },
    },
    include: {
      hauler: true,
      fleet: true,
      pit: true,
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return <RiwayatPage ritasis={ritasis} userId={session.userId} />;
}
