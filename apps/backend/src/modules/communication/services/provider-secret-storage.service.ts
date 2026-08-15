import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ProviderSecretStorage } from '../interfaces/provider-secret-storage.interface';

@Injectable()
export class ProviderSecretStorageService implements ProviderSecretStorage {
  private readonly secretKeyPattern = /(secret|token|key|password|apiKey|auth|clientSecret|privateKey|passphrase|webhookSecret|accessKey)/i;

  isSecretKey(key: string): boolean {
    return this.secretKeyPattern.test(key);
  }

  storeSecret(secret: string): string {
    if (!secret || typeof secret !== 'string') {
      return '';
    }

    return `sha256:${createHash('sha256').update(secret).digest('hex')}`;
  }

  storeCredentials(credentials?: Record<string, any>): Record<string, any> {
    if (!credentials || typeof credentials !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(credentials).map(([key, value]) => [
        key,
        this.isSecretKey(key) && value !== undefined && value !== null && value !== ''
          ? this.storeSecret(String(value))
          : value,
      ]),
    );
  }

  maskCredentials(credentials?: Record<string, any>): Record<string, any> {
    if (!credentials || typeof credentials !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(credentials).map(([key, value]) => [
        key,
        this.isSecretKey(key) ? '********' : this.maskNested(value),
      ]),
    );
  }

  private maskNested(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.maskNested(item));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          this.isSecretKey(key) ? '********' : this.maskNested(item),
        ]),
      );
    }

    return value;
  }
}
