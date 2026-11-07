import { prisma } from "@/lib/prisma";
import AuditLogView from "@/components/admin/AuditLogView";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { name: true, username: true } },
    },
  });

  return (
    <AuditLogView
      logs={logs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        oldValue: l.oldValue,
        newValue: l.newValue,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
        user: l.user,
      }))}
    />
  );
}
