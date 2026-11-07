import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { haulerSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const haulers = await prisma.hauler.findMany({ orderBy: { unitNumber: "asc" }, include: { fleet: { include: { pit: true } } } });
    return NextResponse.json({ haulers });
  } catch (err) {
    console.error("[GET /api/admin/haulers]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const parsed = haulerSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });

    const hauler = await prisma.hauler.create({ data: parsed.data });
    await createAuditLog({ userId: session!.userId, action: "CREATE", entity: "Hauler", entityId: hauler.id, newValue: hauler });
    return NextResponse.json({ hauler }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/haulers]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
