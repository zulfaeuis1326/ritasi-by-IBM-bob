import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { pitSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const existing = await prisma.pit.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "PIT tidak ditemukan" }, { status: 404 });

    const parsed = pitSchema.partial().safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasi gagal" }, { status: 400 });

    const pit = await prisma.pit.update({ where: { id: params.id }, data: parsed.data });
    await createAuditLog({ userId: session!.userId, action: "UPDATE", entity: "Pit", entityId: pit.id, oldValue: existing, newValue: pit });
    return NextResponse.json({ pit });
  } catch (err) {
    console.error("[PATCH /api/admin/pits/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const existing = await prisma.pit.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "PIT tidak ditemukan" }, { status: 404 });

    await prisma.pit.delete({ where: { id: params.id } });
    await createAuditLog({ userId: session!.userId, action: "DELETE", entity: "Pit", entityId: params.id, oldValue: existing });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/pits/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
