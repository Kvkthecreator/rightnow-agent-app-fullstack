import { createCipheriv, randomBytes } from 'node:crypto';

const KEY_LENGTH = 32;

function getKey(): Buffer {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('missing_encryption_key');
  }

  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error('invalid_encryption_key_length');
  }
  return key;
}

export interface EncryptedPayload {
  nonce: string;
  ciphertext: string;
  authTag: string;
}

export function encryptSecret(value: string): EncryptedPayload {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    nonce: iv.toString('base64'),
    ciphertext: encrypted.toString('base64'),
    authTag: authTag.toString('base64')
  };
}
