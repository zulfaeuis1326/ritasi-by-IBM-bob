import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const { searchParams } = req.nextUrl;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const pitId = searchParams.get("pitId");
    const fleetId = searchParams.get("fleetId");
    const shift = searchParams.get("shift");
    const material = searchParams.get("material");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};

    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    if (pitId) where.pitId = pitId;
    if (fleetId) where.fleetId = fleetId;
    if (shift) where.shift = shift;
    if (material) where.material = material;
    if (userId) where.userId = userId;

    const ritasis = await prisma.ritasi.findMany({
      where,
      orderBy: [{ date: "desc" }, { shift: "asc" }],
      include: {
        hauler: { select: { unitNumber: true, type: true } },
        fleet: { select: { name: true } },
        pit: { select: { name: true } },
        user: { select: { name: true } },
      },
      take: 5000,
    });

    return NextResponse.json({ ritasis });
  } catch (err) {
    console.error("[GET /api/admin/laporan]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
