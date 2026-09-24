import { getProvider } from './providers';
import { normalizeIndiaPhone } from './phone';
import type {
  WhatsAppConfig,
  WhatsAppOutboxItem,
  WhatsAppTemplateKind,
} from './types';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function providerCanSend(config: WhatsAppConfig): boolean {
  if (config.provider === 'stub') return true;
  return Boolean(config.metaPhoneNumberId?.trim() && config.metaAccessToken?.trim());
}

export type EnqueueArgs = {
  studentId: string;
  guardianPhoneRaw: string;
  kind: WhatsAppTemplateKind;
  body: string;
  meta?: Record<string, string | number>;
};

export type EnqueueDeps = {
  getConfig: () => WhatsAppConfig;
  pushItem: (item: WhatsAppOutboxItem) => void;
  updateItem: (id: string, patch: Partial<WhatsAppOutboxItem>) => void;
};

/**
 * Normalize, push to outbox, and attempt send when enabled + credentials ready.
 * Never throws; never logs access token.
 */
export async function enqueueAndMaybeSend(
  args: EnqueueArgs,
  deps: EnqueueDeps
): Promise<WhatsAppOutboxItem> {
  const config = deps.getConfig();
  const createdAt = new Date().toISOString();
  const id = uid('wa');

  const normalized = normalizeIndiaPhone(args.guardianPhoneRaw, config.defaultCountryCode);

  if (!normalized) {
    const item: WhatsAppOutboxItem = {
      id,
      studentId: args.studentId,
      guardianPhone: args.guardianPhoneRaw.replace(/\D/g, '') || '',
      kind: args.kind,
      body: args.body,
      status: 'skipped',
      error: 'Invalid guardian phone',
      createdAt,
      meta: args.meta,
    };
    deps.pushItem(item);
    return item;
  }

  if (!config.enabled) {
    const item: WhatsAppOutboxItem = {
      id,
      studentId: args.studentId,
      guardianPhone: normalized,
      kind: args.kind,
      body: args.body,
      status: 'skipped',
      error: 'WhatsApp disabled',
      createdAt,
      meta: args.meta,
    };
    deps.pushItem(item);
    return item;
  }

  const queued: WhatsAppOutboxItem = {
    id,
    studentId: args.studentId,
    guardianPhone: normalized,
    kind: args.kind,
    body: args.body,
    status: 'queued',
    createdAt,
    meta: args.meta,
  };
  deps.pushItem(queued);

  if (!providerCanSend(config)) {
    deps.updateItem(id, {
      status: 'failed',
      error: 'Configure Meta Phone Number ID and token in More → WhatsApp',
    });
    return { ...queued, status: 'failed', error: 'Configure Meta Phone Number ID and token in More → WhatsApp' };
  }

  return sendOne(queued, config, deps.updateItem);
}

async function sendOne(
  item: WhatsAppOutboxItem,
  config: WhatsAppConfig,
  updateItem: (id: string, patch: Partial<WhatsAppOutboxItem>) => void
): Promise<WhatsAppOutboxItem> {
  updateItem(item.id, { status: 'sending', error: undefined });

  const provider = getProvider(config.provider);
  const result = await provider.sendText({
    toE164Digits: item.guardianPhone,
    body: item.body,
    config,
  });

  if (result.ok) {
    const patch: Partial<WhatsAppOutboxItem> = {
      status: 'sent',
      sentAt: new Date().toISOString(),
      providerMessageId: result.messageId,
      error: undefined,
    };
    updateItem(item.id, patch);
    return { ...item, ...patch };
  }

  const patch: Partial<WhatsAppOutboxItem> = {
    status: 'failed',
    error: result.error,
  };
  updateItem(item.id, patch);
  return { ...item, ...patch };
}

/**
 * Retry queued / failed items that have a valid phone and are enabled.
 */
export async function flushOutbox(
  getConfig: () => WhatsAppConfig,
  items: WhatsAppOutboxItem[],
  updateItem: (id: string, patch: Partial<WhatsAppOutboxItem>) => void
): Promise<{ attempted: number; sent: number; failed: number }> {
  const config = getConfig();
  let attempted = 0;
  let sent = 0;
  let failed = 0;

  if (!config.enabled) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  if (!providerCanSend(config)) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const pending = items.filter((i) => i.status === 'queued' || i.status === 'failed');

  for (const item of pending) {
    if (!item.guardianPhone || item.guardianPhone.length < 10) {
      updateItem(item.id, { status: 'skipped', error: 'Invalid guardian phone' });
      failed += 1;
      continue;
    }
    attempted += 1;
    const result = await sendOne(item, config, updateItem);
    if (result.status === 'sent') sent += 1;
    else failed += 1;
  }

  return { attempted, sent, failed };
}
