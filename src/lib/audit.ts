import { prisma } from "./db";

export interface AuditInput {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Record an administrative action. Never throws — audit logging must not break
 * the primary operation, but failures are surfaced to the server log.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: (input.metadata as object | undefined) ?? undefined,
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record action", input.action, error);
  }
}
