import type {
  ProviderSendResult,
  WhatsAppConfig,
  WhatsAppProvider,
} from '../types';

type MetaApiError = {
  message?: string;
  type?: string;
  code?: number;
  error_data?: { messaging_product?: string; details?: string };
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
};

type MetaApiResponse = {
  messages?: { id?: string }[];
  error?: MetaApiError;
  [key: string]: unknown;
};

/**
 * Meta WhatsApp Cloud API sender (text + templates).
 * Demo: token lives in client config — production must move token to
 * Supabase Edge Function / Render; client should only enqueue.
 */
export const metaCloudProvider: WhatsAppProvider = {
  id: 'meta_cloud',

  async sendText({ toE164Digits, body, config }) {
    return postMessage(config, {
      messaging_product: 'whatsapp',
      to: toE164Digits,
      type: 'text',
      text: { preview_url: false, body },
    });
  },

  async sendTemplate({ toE164Digits, name, languageCode, components, config }) {
    const template: Record<string, unknown> = {
      name,
      language: { code: languageCode },
    };
    if (components && components.length > 0) {
      template.components = components;
    }
    return postMessage(config, {
      messaging_product: 'whatsapp',
      to: toE164Digits,
      type: 'template',
      template,
    });
  },
};

async function postMessage(
  config: WhatsAppConfig,
  payload: Record<string, unknown>
): Promise<ProviderSendResult> {
  const phoneNumberId = config.metaPhoneNumberId?.trim() ?? '';
  const token = config.metaAccessToken?.trim() ?? '';
  const apiVersion = (config.metaApiVersion?.trim() || 'v21.0').replace(/^\/+|\/+$/g, '');

  if (!phoneNumberId || !token) {
    return {
      ok: false,
      error: 'Configure Meta Phone Number ID and token in More → WhatsApp',
    };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    let json: MetaApiResponse = {};
    try {
      json = rawText ? (JSON.parse(rawText) as MetaApiResponse) : {};
    } catch {
      return {
        ok: false,
        error: `Meta API HTTP ${res.status}: ${rawText.slice(0, 500) || '(empty body)'}`,
      };
    }

    if (!res.ok) {
      return { ok: false, error: formatMetaError(json, res.status, rawText) };
    }

    const messageId = json.messages?.[0]?.id;
    if (!messageId) {
      return {
        ok: false,
        error: `Meta API returned no message id: ${rawText.slice(0, 500) || JSON.stringify(json)}`,
      };
    }
    return { ok: true, messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error calling Meta API';
    return { ok: false, error: msg };
  }
}

function formatMetaError(
  json: MetaApiResponse,
  httpStatus: number,
  rawText: string
): string {
  const error = json.error;
  const code = error?.code;
  const details =
    error?.error_data?.details ||
    error?.error_user_msg ||
    error?.message ||
    undefined;

  let head: string;
  if (code === 131030) {
    head =
      `(#131030) Recipient not on Meta allow list. In Developers → WhatsApp → ` +
      `Try it out → Manage phone number list, add this guardian number, then retry.`;
  } else if (code === 131047) {
    head =
      `(#131047) Outside 24h customer-care window — free-form text will not deliver. ` +
      `Use an approved template (e.g. hello_world) or wait until the parent messages first.`;
  } else if (code != null) {
    head = `(#${code}) ${details || `Meta API HTTP ${httpStatus}`}`;
  } else if (details) {
    head = details;
  } else {
    head = `Meta API HTTP ${httpStatus}`;
  }

  // Always surface Meta error body in outbox when not ok
  const bodySnippet =
    error != null
      ? JSON.stringify(error)
      : rawText.slice(0, 800) || JSON.stringify(json);
  return `${head} | ${bodySnippet}`;
}
