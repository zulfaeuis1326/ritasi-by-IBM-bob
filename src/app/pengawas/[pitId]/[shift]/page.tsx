import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RitasiInputPage from "@/components/pengawas/RitasiInputPage";
import { Shift } from "@prisma/client";

interface Props {
  params: Promise<{ pitId: string; shift: string }>;
}

export default async function RitasiPage({ params }: Props) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) redirect("/login");

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) redirect("/login");

  const { pitId, shift } = await params;
  const shiftEnum = shift.toUpperCase() as Shift;

  if (!["PAGI", "SIANG", "MALAM"].includes(shiftEnum)) notFound();

  // Ensure pengawas only sees their PIT
  if (session.user.pitId && session.user.pitId !== pitId) {
    redirect("/pengawas");
  }

  const pit = await prisma.pit.findUnique({
    where: { id: pitId, isActive: true },
    include: {
      fleets: {
        where: { isActive: true },
        orderBy: { code: "asc" },
        include: {
          haulers: {
            where: { isActive: true },
            orderBy: { unitNumber: "asc" },
          },
        },
      },
    },
  });

  if (!pit) notFound();

  // Today's ritasi for this shift
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingRitasis = await prisma.ritasi.findMany({
    where: {
      pitId,
      shift: shiftEnum,
      date: today,
    },
    include: { hauler: true, user: true },
  });

  return (
    <RitasiInputPage
      pit={pit}
      shift={shiftEnum}
      userId={session.userId}
      existingRitasis={existingRitasis}
      today={today.toISOString()}
    />
  );
}
