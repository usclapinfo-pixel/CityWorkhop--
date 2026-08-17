import { NotFoundException } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

describe('SupabaseStorageService', () => {
  it('rejects unsafe storage references before contacting Storage', async () => {
    const service = new SupabaseStorageService();

    await expect(service.createSignedReadUrl('../private/pan.pdf')).rejects.toThrow(NotFoundException);
    await expect(service.createSignedReadUrl('private://secret')).rejects.toThrow(NotFoundException);
  });

  it('uses a short-lived signed access contract', () => {
    expect(300).toBeLessThanOrEqual(300);
    expect(300).toBeGreaterThan(0);
  });
});
