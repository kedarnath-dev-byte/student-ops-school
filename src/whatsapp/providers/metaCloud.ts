import type { WhatsAppProvider } from '../types';

/**
 * Meta WhatsApp Cloud API text sender.
 * Demo: token lives in client config — production must move token to
 * Supabase Edge Function / Render; client should only enqueue.
 */
export const metaCloudProvider: WhatsAppProvider = {
  id: 'meta_cloud',

  async sendText({ toE164Digits, body, config }) {
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
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toE164Digits,
          type: 'text',
          text: { preview_url: false, body },
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        messages?: { id?: string }[];
        error?: { message?: string; error_user_msg?: string };
      };

      if (!res.ok) {
        const msg =
          json.error?.error_user_msg ||
          json.error?.message ||
          `Meta API HTTP ${res.status}`;
        return { ok: false, error: msg };
      }

      const messageId = json.messages?.[0]?.id;
      if (!messageId) {
        return { ok: false, error: 'Meta API returned no message id' };
      }
      return { ok: true, messageId };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error calling Meta API';
      return { ok: false, error: msg };
    }
  },
};
