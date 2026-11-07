import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  trips: z.number().int().min(0).max(999).optional(),
  keterangan: z.string().max(500).nullable().optional(),
  ritasiTime: z.string().optional().nullable(),
});

// PATCH /api/ritasi/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(req);
  const authErr = requireAuth(session);
  if (authErr) return authErr;

  try {
    const { id } = params;

    const existing = await prisma.ritasi.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    // Pengawas can only edit their own records
    if (
      session!.user.role === "PENGAWAS" &&
      existing.userId !== session!.userId
    ) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.ritasi.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      userId: session!.userId,
      action: "UPDATE",
      entity: "Ritasi",
      entityId: id,
      oldValue: { trips: existing.trips, keterangan: existing.keterangan },
      newValue: parsed.data,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ ritasi: updated });
  } catch (err) {
    console.error("[PATCH /api/ritasi/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/ritasi/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(req);
  const authErr = requireAuth(session);
  if (authErr) return authErr;

  try {
    const { id } = params;

    const existing = await prisma.ritasi.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (
      session!.user.role === "PENGAWAS" &&
      existing.userId !== session!.userId
    ) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    await prisma.ritasi.delete({ where: { id } });

    await createAuditLog({
      userId: session!.userId,
      action: "DELETE",
      entity: "Ritasi",
      entityId: id,
      oldValue: existing,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/ritasi/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
