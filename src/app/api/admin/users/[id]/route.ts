import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession, requireAdmin } from "@/lib/auth";
import { userUpdateSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    const parsed = userUpdateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });

    const { password, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }
    if ("pitId" in rest) {
      updateData.pitId = rest.pitId ?? null;
    }

    const user = await prisma.user.update({ where: { id: params.id }, data: updateData });
    await createAuditLog({ userId: session!.userId, action: "UPDATE", entity: "User", entityId: params.id, oldValue: { name: existing.name, isActive: existing.isActive }, newValue: { name: user.name, isActive: user.isActive } });

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("[PATCH /api/admin/users/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    if (params.id === session!.userId) {
      return NextResponse.json({ error: "Tidak bisa hapus akun sendiri" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    await prisma.user.delete({ where: { id: params.id } });
    await createAuditLog({ userId: session!.userId, action: "DELETE", entity: "User", entityId: params.id, oldValue: { name: existing.name } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/users/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
