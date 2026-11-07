import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { haulerSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const existing = await prisma.hauler.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Unit tidak ditemukan" }, { status: 404 });

    const parsed = haulerSchema.partial().safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasi gagal" }, { status: 400 });

    const hauler = await prisma.hauler.update({ where: { id: params.id }, data: parsed.data });
    await createAuditLog({ userId: session!.userId, action: "UPDATE", entity: "Hauler", entityId: hauler.id, oldValue: existing, newValue: hauler });
    return NextResponse.json({ hauler });
  } catch (err) {
    console.error("[PATCH /api/admin/haulers/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    await prisma.hauler.delete({ where: { id: params.id } }).catch(() => null);
    await createAuditLog({ userId: session!.userId, action: "DELETE", entity: "Hauler", entityId: params.id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/haulers/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
