import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PengawasShell from "@/components/pengawas/PengawasShell";

export default async function PengawasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) redirect("/login");

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { pit: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    redirect("/login");
  }

  if (session.user.role !== "PENGAWAS") {
    redirect("/admin");
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    username: session.user.username,
    role: session.user.role,
    pit: session.user.pit,
  };

  return <PengawasShell user={user}>{children}</PengawasShell>;
}
