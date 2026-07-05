import crypto from 'crypto';

export function encryptPayload(plainText: string) {
  const iv = crypto.randomBytes(12);
  const key = crypto.randomBytes(32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    payload: Buffer.concat([iv, tag, encrypted]).toString('base64'),
    metadata: Buffer.concat([key]).toString('base64')
  };
}

export function decryptPayload(payload: string, metadata: string) {
  const buffer = Buffer.from(payload, 'base64');
  const key = Buffer.from(metadata, 'base64');
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
