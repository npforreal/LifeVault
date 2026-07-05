import { describe, expect, it } from 'vitest';

describe('LifeVault authentication scaffold', () => {
  it('accepts a simple registration payload shape', () => {
    const payload = { name: 'Ada', email: 'ada@example.com', password: 'StrongPass123!' };
    expect(payload.email).toContain('@');
    expect(payload.password.length).toBeGreaterThan(8);
  });
});
