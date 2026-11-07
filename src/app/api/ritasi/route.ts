import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAuth } from "@/lib/auth";
import { ritasiUpsertSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

// POST /api/ritasi — upsert a trip count entry
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  const authErr = requireAuth(session);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const parsed = ritasiUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { haulerId, material, trips, shift, date, ritasiTime, keterangan } = parsed.data;

    // Verify hauler belongs to PIT accessible by this user
    const hauler = await prisma.hauler.findUnique({
      where: { id: haulerId },
      include: { fleet: { include: { pit: true } } },
    });

    if (!hauler || !hauler.isActive) {
      return NextResponse.json({ error: "Unit tidak ditemukan" }, { status: 404 });
    }

    if (
      session!.user.role === "PENGAWAS" &&
      session!.user.pitId &&
      hauler.fleet.pit.id !== session!.user.pitId
    ) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const ritasiDate = new Date(date);

    const existing = await prisma.ritasi.findUnique({
      where: {
        haulerId_material_date_shift: {
          haulerId,
          material: material as any,
          date: ritasiDate,
          shift: shift as any,
        },
      },
    });

    let ritasi;
    if (existing) {
      ritasi = await prisma.ritasi.update({
        where: { id: existing.id },
        data: {
          trips,
          ritasiTime: ritasiTime ? new Date(`${date}T${ritasiTime}`) : undefined,
          keterangan: keterangan ?? existing.keterangan,
        },
      });
      await createAuditLog({
        userId: session!.userId,
        action: "UPDATE",
        entity: "Ritasi",
        entityId: ritasi.id,
        oldValue: { trips: existing.trips },
        newValue: { trips },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      });
    } else {
      ritasi = await prisma.ritasi.create({
        data: {
          haulerId,
          fleetId: hauler.fleetId,
          pitId: hauler.fleet.pitId,
          userId: session!.userId,
          date: ritasiDate,
          shift: shift as any,
          material: material as any,
          trips,
          ritasiTime: ritasiTime ? new Date(`${date}T${ritasiTime}`) : null,
          keterangan: keterangan ?? null,
        },
      });
      await createAuditLog({
        userId: session!.userId,
        action: "CREATE",
        entity: "Ritasi",
        entityId: ritasi.id,
        newValue: { trips, material, shift },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      });
    }

    return NextResponse.json({ ritasi });
  } catch (err) {
    console.error("[POST /api/ritasi]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/ritasi?pitId=&shift=&date=
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const authErr = requireAuth(session);
  if (authErr) return authErr;

  try {
    const { searchParams } = req.nextUrl;
    const pitId = searchParams.get("pitId");
    const shift = searchParams.get("shift");
    const date = searchParams.get("date");

    const where: Record<string, unknown> = {};
    if (pitId) where.pitId = pitId;
    if (shift) where.shift = shift;
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
      }
      where.date = parsedDate;
    }

    // Pengawas can only see their PIT
    if (session!.user.role === "PENGAWAS" && session!.user.pitId) {
      where.pitId = session!.user.pitId;
    }

    const ritasis = await prisma.ritasi.findMany({
      where,
      include: { hauler: true, fleet: true, pit: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ritasis });
  } catch (err) {
    console.error("[GET /api/ritasi]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
