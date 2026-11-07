import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) redirect("/login");

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/pengawas");
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    username: session.user.username,
    role: session.user.role,
  };

  return <AdminShell user={user}>{children}</AdminShell>;
}
