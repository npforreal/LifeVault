import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createVaultItem, destroyVaultItem, listVaultItems } from '../services/vaultService.js';
import { logAudit } from '../services/auditService.js';
import { decryptBackupBundle, encryptBackupBundle } from '../services/backupService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const items = await listVaultItems(req.user!.id);
  await logAudit(req.user!.id, 'VAULT_LIST', 'SUCCESS', req.ip);
  res.json(items);
});

router.get('/notifications', authenticate, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  res.json(notifications);
});

router.post('/', authenticate, async (req, res) => {
  const { title, description, categoryName, content } = req.body;
  const result = await createVaultItem(req.user!.id, { title, description, categoryName, content });
  await logAudit(req.user!.id, 'VAULT_CREATE', 'SUCCESS', req.ip);
  res.status(201).json(result);
});

router.post('/:itemId/destroy', authenticate, async (req, res) => {
  const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  await destroyVaultItem(req.user!.id, itemId);
  await logAudit(req.user!.id, 'VAULT_DESTROY', 'SUCCESS', req.ip);
  res.json({ ok: true });
});

router.get('/backup', authenticate, async (req, res) => {
  const [vaultItems, deletionPlans, connectedAccounts] = await Promise.all([
    prisma.vaultItem.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } }),
    prisma.deletionPlan.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } }),
    prisma.connectedAccount.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } })
  ]);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    vaultItems,
    deletionPlans,
    connectedAccounts
  };

  const { passphrase } = req.query;
  const exportString = encryptBackupBundle(payload, typeof passphrase === 'string' ? passphrase : 'lifevault-default');
  res.json({ exportString });
});

router.post('/restore', authenticate, async (req, res) => {
  const { exportString, passphrase } = req.body;
  if (!exportString) {
    return res.status(400).json({ error: 'exportString is required' });
  }

  try {
    const bundle = decryptBackupBundle(exportString, passphrase ?? 'lifevault-default') as Record<string, any>;
    const vaultItems = Array.isArray(bundle.vaultItems) ? bundle.vaultItems : [];
    const deletionPlans = Array.isArray(bundle.deletionPlans) ? bundle.deletionPlans : [];
    const connectedAccounts = Array.isArray(bundle.connectedAccounts) ? bundle.connectedAccounts : [];

    await prisma.$transaction(async (tx) => {
      await tx.vaultItem.deleteMany({ where: { userId: req.user!.id } });
      await tx.deletionPlan.deleteMany({ where: { userId: req.user!.id } });
      await tx.connectedAccount.deleteMany({ where: { userId: req.user!.id } });

      if (vaultItems.length > 0) {
        await tx.vaultItem.createMany({ data: vaultItems.map((item: any) => ({
          id: item.id,
          userId: req.user!.id,
          title: item.title,
          description: item.description ?? null,
          categoryId: item.categoryId ?? null,
          encryptedPayload: item.encryptedPayload,
          encryptionMetadata: item.encryptionMetadata,
          status: item.status ?? 'ACTIVE',
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          destroyAt: item.destroyAt ? new Date(item.destroyAt) : null
        })) });
      }

      if (deletionPlans.length > 0) {
        await tx.deletionPlan.createMany({ data: deletionPlans.map((plan: any) => ({
          id: plan.id,
          userId: req.user!.id,
          name: plan.name,
          description: plan.description ?? null,
          schedule: plan.schedule,
          createdAt: plan.createdAt ? new Date(plan.createdAt) : undefined
        })) });
      }

      if (connectedAccounts.length > 0) {
        await tx.connectedAccount.createMany({ data: connectedAccounts.map((account: any) => ({
          id: account.id,
          userId: req.user!.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessTokenEncrypted: account.accessTokenEncrypted,
          refreshTokenEncrypted: account.refreshTokenEncrypted ?? null,
          scopes: account.scopes ?? null,
          status: account.status ?? 'ACTIVE',
          createdAt: account.createdAt ? new Date(account.createdAt) : undefined,
          updatedAt: account.updatedAt ? new Date(account.updatedAt) : undefined
        })) });
      }
    });

    await logAudit(req.user!.id, 'BACKUP_RESTORE', 'SUCCESS', req.ip);
    res.json({ restored: true });
  } catch (error) {
    await logAudit(req.user!.id, 'BACKUP_RESTORE', 'FAILURE', req.ip);
    res.status(400).json({ error: 'Invalid backup bundle' });
  }
});

export { router as vaultRouter };
