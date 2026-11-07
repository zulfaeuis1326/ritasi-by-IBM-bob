import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (session && session.expiresAt > new Date()) {
      if (session.user.role === "ADMIN") {
        redirect("/admin");
      } else {
        redirect("/pengawas");
      }
    }
  }

  redirect("/login");
}
