import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
}: {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: object | null;
  newValue?: object | null;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit log failure must never break the main flow
    console.error("[AuditLog] Failed to write:", err);
  }
}
