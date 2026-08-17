import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { storageConfig } from '@config/storage.config';

export interface SignedKycDocumentAccess {
  accessUrl: string;
  expiresIn: number;
  contentType?: string;
}

@Injectable()
export class SupabaseStorageService {
  private client?: SupabaseClient;

  private getClient(): SupabaseClient {
    if (!storageConfig.supabase.url || !storageConfig.supabase.serviceRoleKey) {
      throw new InternalServerErrorException('Secure document storage is not configured');
    }

    this.client ??= createClient(storageConfig.supabase.url, storageConfig.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.client;
  }

  async createSignedReadUrl(storageReference: string, contentType?: string): Promise<SignedKycDocumentAccess> {
    if (!this.isSafeObjectPath(storageReference)) {
      throw new NotFoundException('Document is unavailable');
    }

    const { data, error } = await this.getClient().storage
      .from(storageConfig.supabase.kycBucket)
      .createSignedUrl(storageReference, storageConfig.supabase.signedUrlExpirySeconds);

    if (error || !data?.signedUrl) {
      throw new NotFoundException('Document is unavailable');
    }

    return {
      accessUrl: data.signedUrl,
      expiresIn: storageConfig.supabase.signedUrlExpirySeconds,
      ...(contentType ? { contentType } : {}),
    };
  }

  private isSafeObjectPath(storageReference: string): boolean {
    return Boolean(
      storageReference &&
      storageReference.length <= 1000 &&
      !storageReference.includes('..') &&
      !storageReference.includes('\\') &&
      !storageReference.startsWith('/') &&
      !/^[a-z][a-z\d+.-]*:\/\//i.test(storageReference),
    );
  }
}
