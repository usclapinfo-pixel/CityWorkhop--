/**
 * Current boundary: this is a storage abstraction for provider credentials.
 * The default implementation uses a non-reversible hash placeholder instead of
 * storing raw secret values in the provider_config JSON payload. This keeps the
 * current architecture safe without introducing a production secret manager.
 * A future implementation can swap in a KMS / Vault-backed provider behind this
 * interface without changing the admin API contract.
 */
export interface ProviderSecretStorage {
  isSecretKey(key: string): boolean;
  storeSecret(secret: string): string;
  storeCredentials(credentials?: Record<string, any>): Record<string, any>;
  maskCredentials(credentials?: Record<string, any>): Record<string, any>;
}
