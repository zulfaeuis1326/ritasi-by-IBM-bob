import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { pitSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const pits = await prisma.pit.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ pits });
  } catch (err) {
    console.error("[GET /api/admin/pits]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  const err = requireAdmin(session);
  if (err) return err;

  try {
    const parsed = pitSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });

    const pit = await prisma.pit.create({ data: parsed.data });
    await createAuditLog({ userId: session!.userId, action: "CREATE", entity: "Pit", entityId: pit.id, newValue: pit });
    return NextResponse.json({ pit }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/pits]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
