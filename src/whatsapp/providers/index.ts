import type { WhatsAppProvider, WhatsAppProviderId } from '../types';
import { metaCloudProvider } from './metaCloud';
import { stubProvider } from './stub';

export function getProvider(id: WhatsAppProviderId): WhatsAppProvider {
  if (id === 'stub') return stubProvider;
  return metaCloudProvider;
}
