export type WhatsAppProviderId = 'meta_cloud' | 'stub';
export type WhatsAppTemplateKind = 'fee_receipt' | 'test_progress' | 'absence_alert';
export type WhatsAppMessageStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'skipped';

export interface WhatsAppConfig {
  enabled: boolean;
  provider: WhatsAppProviderId;
  /** E.164 country code without + , default 91 */
  defaultCountryCode: string;
  metaPhoneNumberId: string;
  /** Demo only — move to server (Edge Function / Render) in production. Never log or share. */
  metaAccessToken: string;
  metaApiVersion: string; // e.g. 'v21.0'
}

export interface WhatsAppOutboxItem {
  id: string;
  studentId: string;
  guardianPhone: string; // normalized digits
  kind: WhatsAppTemplateKind;
  body: string; // plaintext (Meta free-form within 24h; approved templates needed for cold outbound)
  status: WhatsAppMessageStatus;
  error?: string;
  createdAt: string;
  sentAt?: string;
  providerMessageId?: string;
  meta?: Record<string, string | number>;
}

export interface WhatsAppProvider {
  id: WhatsAppProviderId;
  sendText(args: {
    toE164Digits: string; // no +
    body: string;
    config: WhatsAppConfig;
  }): Promise<{ ok: true; messageId: string } | { ok: false; error: string }>;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  enabled: false,
  provider: 'meta_cloud',
  defaultCountryCode: '91',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  metaApiVersion: 'v21.0',
};
