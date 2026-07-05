import { PrismaClient } from '@prisma/client';
import { encryptPayload, decryptPayload } from '../crypto/encryption.js';

const prisma = new PrismaClient();

export async function listVaultItems(userId: string) {
  const items = await prisma.vaultItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { category: true }
  });

  return items.map((item) => ({
    ...item,
    preview: item.encryptedPayload ? decryptPayload(item.encryptedPayload, item.encryptionMetadata).slice(0, 80) : ''
  }));
}

export async function createVaultItem(userId: string, input: { title: string; description?: string; categoryName?: string; content: string }) {
  const encrypted = encryptPayload(input.content);
  const category = await prisma.category.create({
    data: { name: input.categoryName ?? 'General', userId }
  }).catch(() => null);

  const item = await prisma.vaultItem.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      categoryId: category?.id,
      encryptedPayload: encrypted.payload,
      encryptionMetadata: encrypted.metadata,
      status: 'ACTIVE'
    }
  });

  return {
    item,
    preview: decryptPayload(encrypted.payload, encrypted.metadata)
  };
}

export async function destroyVaultItem(userId: string, itemId: string) {
  const item = await prisma.vaultItem.findFirst({ where: { id: itemId, userId } });
  if (!item) {
    throw new Error('Vault item not found');
  }

  await prisma.$transaction(async (tx) => {
    await tx.vaultItem.update({ where: { id: itemId }, data: { status: 'DESTROYED', destroyAt: new Date() } });
    await tx.destroyedItem.create({ data: { itemId } });
  });

  return { ok: true };
}
