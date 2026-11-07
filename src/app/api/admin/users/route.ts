import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession, requireAdmin } from "@/lib/auth";
import { userSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const users = await prisma.user.findMany({
      where: { role: "PENGAWAS" },
      orderBy: { name: "asc" },
      include: { pit: { select: { name: true } } },
      omit: { passwordHash: true },
    } as any);
    return NextResponse.json({ users });
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const parsed = userSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });

    const { password, ...rest } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({ where: { username: rest.username } });
    if (existing) return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });

    const user = await prisma.user.create({
      data: { ...rest, passwordHash, pitId: rest.pitId ?? null },
      omit: { passwordHash: true },
    } as any);

    await createAuditLog({ userId: session!.userId, action: "CREATE", entity: "User", entityId: user.id, newValue: { name: user.name, username: user.username } });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/users]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
