import { Injectable, Logger } from '@nestjs/common';
import { IProviderAdapter, ProviderType } from '../interfaces/provider.interface';
import { Msg91Provider } from './msg91.provider';
import { WhatsAppBusinessProvider } from './whatsapp-business.provider';
import { LocalWhatsAppProvider } from './local-whatsapp.provider';
import { N8nAutomationProvider } from './n8n.provider';

@Injectable()
export class ProviderRegistryService {
  private readonly logger = new Logger(ProviderRegistryService.name);
  private readonly providers = new Map<ProviderType, IProviderAdapter>();

  constructor(
    private readonly msg91Provider: Msg91Provider,
    private readonly whatsappBusinessProvider: WhatsAppBusinessProvider,
    private readonly localWhatsAppProvider: LocalWhatsAppProvider,
    private readonly n8nAutomationProvider: N8nAutomationProvider,
  ) {
    this.providers.set(this.msg91Provider.type, this.msg91Provider);
    this.providers.set(this.whatsappBusinessProvider.type, this.whatsappBusinessProvider);
    this.providers.set(this.localWhatsAppProvider.type, this.localWhatsAppProvider);
    this.providers.set(this.n8nAutomationProvider.type, this.n8nAutomationProvider);
  }

  getProvider(type: ProviderType): IProviderAdapter | undefined {
    const provider = this.providers.get(type);
    if (!provider) {
      this.logger.warn(`Provider not registered: ${type}`);
    }
    return provider;
  }

  getAllProviders(): IProviderAdapter[] {
    return Array.from(this.providers.values());
  }
}
