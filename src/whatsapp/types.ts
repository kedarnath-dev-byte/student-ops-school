export type WhatsAppProviderId = 'meta_cloud' | 'stub';
export type WhatsAppTemplateKind =
  | 'fee_receipt'
  | 'test_progress'
  | 'absence_alert'
  | 'connection_test';
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

/** Meta Cloud template component (header/body/button params). */
export type WhatsAppTemplateComponent = {
  type: 'header' | 'body' | 'button';
  sub_type?: string;
  index?: string | number;
  parameters?: Array<Record<string, unknown>>;
};

export interface WhatsAppOutboxItem {
  id: string;
  studentId: string;
  guardianPhone: string; // normalized digits
  kind: WhatsAppTemplateKind;
  body: string; // plaintext or template descriptor for outbox display
  status: WhatsAppMessageStatus;
  error?: string;
  createdAt: string;
  sentAt?: string;
  providerMessageId?: string;
  meta?: Record<string, string | number>;
}

export type ProviderSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export interface WhatsAppProvider {
  id: WhatsAppProviderId;
  sendText(args: {
    toE164Digits: string; // no +
    body: string;
    config: WhatsAppConfig;
  }): Promise<ProviderSendResult>;
  /** Meta-approved template (e.g. hello_world / en_US). Required for cold outbound. */
  sendTemplate(args: {
    toE164Digits: string;
    name: string;
    languageCode: string;
    components?: WhatsAppTemplateComponent[];
    config: WhatsAppConfig;
  }): Promise<ProviderSendResult>;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  enabled: false,
  provider: 'meta_cloud',
  defaultCountryCode: '91',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  metaApiVersion: 'v21.0',
};

/** Meta default sandbox template — same as Developers → WhatsApp → Try it out. */
export const META_TEST_TEMPLATE_NAME = 'hello_world';
export const META_TEST_TEMPLATE_LANG = 'en_US';
