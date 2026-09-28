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
  /**
   * Meta template name for fee receipts. Default hello_world (sandbox-safe).
   * Set to your approved custom template once Meta approves it.
   */
  templateFee?: string;
  /**
   * Meta template name for test progress. Default hello_world.
   */
  templateTest?: string;
  /**
   * Meta template name for absence alerts. Default hello_world.
   */
  templateAbsence?: string;
  /** Meta template language code. Default en_US. */
  templateLanguage?: string;
  /**
   * If true, send free-form text instead of templates (needs open 24h window).
   * Default false for meta_cloud so sandbox hello_world delivery works today.
   */
  useFreeFormText?: boolean;
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

/** Meta default sandbox template — same as Developers → WhatsApp → Try it out. */
export const META_TEST_TEMPLATE_NAME = 'hello_world';
export const META_TEST_TEMPLATE_LANG = 'en_US';

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  enabled: false,
  provider: 'meta_cloud',
  defaultCountryCode: '91',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  metaApiVersion: 'v21.0',
  templateFee: META_TEST_TEMPLATE_NAME,
  templateTest: META_TEST_TEMPLATE_NAME,
  templateAbsence: META_TEST_TEMPLATE_NAME,
  templateLanguage: META_TEST_TEMPLATE_LANG,
  useFreeFormText: false,
};

/**
 * Whether Meta Cloud should send via approved templates (vs free-form text).
 * Stub always can use either; free-form only when useFreeFormText is true.
 */
export function shouldUseMetaTemplate(config: WhatsAppConfig): boolean {
  if (config.provider !== 'meta_cloud') return false;
  return !config.useFreeFormText;
}

/**
 * Resolve template name + language for an outbox kind.
 * Defaults to hello_world / en_US so Meta sandbox delivery works before custom templates exist.
 */
export function resolveTemplateForKind(
  kind: WhatsAppTemplateKind,
  config: WhatsAppConfig
): { name: string; languageCode: string } {
  const languageCode =
    config.templateLanguage?.trim() || META_TEST_TEMPLATE_LANG;
  switch (kind) {
    case 'fee_receipt':
      return {
        name: config.templateFee?.trim() || META_TEST_TEMPLATE_NAME,
        languageCode,
      };
    case 'test_progress':
      return {
        name: config.templateTest?.trim() || META_TEST_TEMPLATE_NAME,
        languageCode,
      };
    case 'absence_alert':
      return {
        name: config.templateAbsence?.trim() || META_TEST_TEMPLATE_NAME,
        languageCode,
      };
    case 'connection_test':
    default:
      return { name: META_TEST_TEMPLATE_NAME, languageCode };
  }
}

/**
 * hello_world has no body variables — never send components for it.
 * Custom templates may pass components later; callers supply them when ready.
 */
export function templateAcceptsBodyVars(templateName: string): boolean {
  return templateName.trim().toLowerCase() !== META_TEST_TEMPLATE_NAME;
}
