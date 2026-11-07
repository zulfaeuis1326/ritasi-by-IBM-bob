import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";

export async function getSession(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { pit: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export function requireAuth(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireRole(
  session: Awaited<ReturnType<typeof getSession>>,
  role: "ADMIN" | "PENGAWAS"
) {
  const authErr = requireAuth(session);
  if (authErr) return authErr;
  if (session!.user.role !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  return requireRole(session, "ADMIN");
}
