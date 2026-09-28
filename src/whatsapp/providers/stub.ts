import type { WhatsAppProvider } from '../types';

/** Offline demo: marks messages sent locally without calling Meta. */
export const stubProvider: WhatsAppProvider = {
  id: 'stub',

  async sendText({ toE164Digits }) {
    const messageId = `stub-${Date.now()}-${toE164Digits.slice(-4)}`;
    return { ok: true, messageId };
  },

  async sendTemplate({ toE164Digits, name, languageCode }) {
    const messageId = `stub-tpl-${name}-${languageCode}-${Date.now()}-${toE164Digits.slice(-4)}`;
    return { ok: true, messageId };
  },
};
