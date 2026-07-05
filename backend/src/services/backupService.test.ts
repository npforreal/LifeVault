import { describe, expect, it } from 'vitest';
import { decryptBackupBundle, encryptBackupBundle } from './backupService.js';

describe('backup bundle encryption', () => {
  it('round-trips a backup bundle with a passphrase', () => {
    const bundle = {
      version: 1,
      exportedAt: '2026-07-05T00:00:00.000Z',
      vaultItems: [{ title: 'Passport', encryptedPayload: 'abc', encryptionMetadata: 'def' }],
      deletionPlans: [{ name: 'Quarterly cleanup', schedule: '90 days' }],
      connectedAccounts: [{ provider: 'Google', status: 'ACTIVE' }]
    };

    const serialized = encryptBackupBundle(bundle, 'super-secret');
    const restored = decryptBackupBundle<{
      version: number;
      exportedAt: string;
      vaultItems: Array<{ title: string; encryptedPayload: string; encryptionMetadata: string }>;
      deletionPlans: Array<{ name: string; schedule: string }>;
      connectedAccounts: Array<{ provider: string; status: string }>;
    }>(serialized, 'super-secret');

    expect(restored.vaultItems[0].title).toBe('Passport');
    expect(restored.deletionPlans[0].schedule).toBe('90 days');
    expect(restored.connectedAccounts[0].provider).toBe('Google');
  });
});
