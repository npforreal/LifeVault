import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logAudit } from '../services/auditService.js';

const prisma = new PrismaClient();

export function startLifecycleScheduler() {
  cron.schedule('*/10 * * * * *', async () => {
    const dueItems = await prisma.vaultItem.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { not: null }
      }
    });

    for (const item of dueItems) {
      if (item.expiresAt && item.expiresAt <= new Date()) {
        await prisma.vaultItem.update({
          where: { id: item.id },
          data: { status: 'EXPIRED' }
        });
        await prisma.notification.create({
          data: {
            userId: item.userId,
            title: 'Vault item expired',
            body: `${item.title} has reached its expiration window.`
          }
        });
        await logAudit(item.userId, 'VAULT_EXPIRE', 'SUCCESS');
      }
    }
  });
}
