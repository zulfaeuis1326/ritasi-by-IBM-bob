import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (session) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    await createAuditLog({
      userId: session.userId,
      action: "LOGOUT",
      entity: "User",
      entityId: session.userId,
    });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("session_token");
  return res;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      username: session.user.username,
      role: session.user.role,
      pit: session.user.pit,
    },
  });
}
