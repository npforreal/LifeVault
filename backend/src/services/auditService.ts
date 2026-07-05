import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logAudit(userId: string | null, action: string, result: string, ipAddress?: string) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      result,
      ipAddress
    }
  });
}
