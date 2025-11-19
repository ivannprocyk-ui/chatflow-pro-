import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // La clave debe ser de 32 bytes (64 caracteres hex)
    const encryptionKey = process.env.ENCRYPTION_KEY || this.generateKey();
    this.key = Buffer.from(encryptionKey, 'hex');

    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  /**
   * Genera una clave de encriptación aleatoria
   * Solo usar en desarrollo - en producción debe estar en .env
   */
  private generateKey(): string {
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  ENCRYPTION_KEY not found. Generated temporary key:', key);
    console.warn('⚠️  Add this to your .env file: ENCRYPTION_KEY=' + key);
    return key;
  }

  /**
   * Encripta un texto plano
   * @param text Texto a encriptar
   * @returns String en formato: iv:authTag:encrypted
   */
  encrypt(text: string): string {
    if (!text) return text;

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Formato: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Error encrypting:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Desencripta un texto
   * @param encryptedText String en formato: iv:authTag:encrypted
   * @returns Texto plano
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }

      const [ivHex, authTagHex, encrypted] = parts;

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Error decrypting:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encripta campos sensibles de un objeto
   */
  encryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
  ): T {
    const result = { ...obj };
    fields.forEach((field) => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.encrypt(result[field] as string) as any;
      }
    });
    return result;
  }

  /**
   * Desencripta campos sensibles de un objeto
   */
  decryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
  ): T {
    const result = { ...obj };
    fields.forEach((field) => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.decrypt(result[field] as string) as any;
      }
    });
    return result;
  }
}
