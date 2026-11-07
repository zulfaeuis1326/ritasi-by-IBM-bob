import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { fleetSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const fleets = await prisma.fleet.findMany({ orderBy: { name: "asc" }, include: { pit: true } });
    return NextResponse.json({ fleets });
  } catch (err) {
    console.error("[GET /api/admin/fleets]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const parsed = fleetSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasi gagal" }, { status: 400 });

    const fleet = await prisma.fleet.create({ data: parsed.data });
    await createAuditLog({ userId: session!.userId, action: "CREATE", entity: "Fleet", entityId: fleet.id, newValue: fleet });
    return NextResponse.json({ fleet }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/fleets]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
