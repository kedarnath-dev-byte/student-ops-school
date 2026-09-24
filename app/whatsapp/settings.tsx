import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card,
  Chip,
  Field,
  Label,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import type { WhatsAppProviderId } from '../../src/whatsapp/types';
import { templateKindLabel } from '../../src/whatsapp/templates';
import { formatDateTime } from '../../src/lib/format';

export default function WhatsAppSettingsScreen() {
  const router = useRouter();
  const isPartner = useMockStore((s) => s.isPartner());
  const config = useMockStore((s) => s.whatsappConfig);
  const outbox = useMockStore((s) => s.whatsappOutbox);
  const students = useMockStore((s) => s.students);
  const updateWhatsAppConfig = useMockStore((s) => s.updateWhatsAppConfig);
  const flushWhatsAppOutbox = useMockStore((s) => s.flushWhatsAppOutbox);
  const sendWhatsAppTestToFirstGuardian = useMockStore(
    (s) => s.sendWhatsAppTestToFirstGuardian
  );

  const [enabled, setEnabled] = useState(config.enabled);
  const [provider, setProvider] = useState<WhatsAppProviderId>(config.provider);
  const [countryCode, setCountryCode] = useState(config.defaultCountryCode);
  const [phoneNumberId, setPhoneNumberId] = useState(config.metaPhoneNumberId);
  const [accessToken, setAccessToken] = useState(config.metaAccessToken);
  const [apiVersion, setApiVersion] = useState(config.metaApiVersion);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPartner) {
      Alert.alert('Partners only', 'WhatsApp settings are for partners.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [isPartner, router]);

  useEffect(() => {
    setEnabled(config.enabled);
    setProvider(config.provider);
    setCountryCode(config.defaultCountryCode);
    setPhoneNumberId(config.metaPhoneNumberId);
    setAccessToken(config.metaAccessToken);
    setApiVersion(config.metaApiVersion);
  }, [config]);

  const recent = useMemo(() => outbox.slice(0, 30), [outbox]);

  const studentName = (id: string) =>
    students.find((s) => s.id === id)?.name ?? id;

  if (!isPartner) {
    return (
      <Screen>
        <Title>WhatsApp</Title>
        <Subtitle>Partners only</Subtitle>
      </Screen>
    );
  }

  const save = () => {
    try {
      updateWhatsAppConfig({
        enabled,
        provider,
        defaultCountryCode: countryCode.replace(/\D/g, '') || '91',
        metaPhoneNumberId: phoneNumberId.trim(),
        metaAccessToken: accessToken.trim(),
        metaApiVersion: apiVersion.trim() || 'v21.0',
      });
      Alert.alert('Saved', 'WhatsApp settings updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      // Persist current form first so test uses latest values
      updateWhatsAppConfig({
        enabled,
        provider,
        defaultCountryCode: countryCode.replace(/\D/g, '') || '91',
        metaPhoneNumberId: phoneNumberId.trim(),
        metaAccessToken: accessToken.trim(),
        metaApiVersion: apiVersion.trim() || 'v21.0',
      });
      const item = await sendWhatsAppTestToFirstGuardian();
      if (!item) {
        Alert.alert('No students', 'Add a student first.');
        return;
      }
      Alert.alert(
        'Test result',
        `Status: ${item.status}${item.error ? `\n${item.error}` : ''}${
          item.providerMessageId ? `\nId: ${item.providerMessageId}` : ''
        }`
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Test failed');
    } finally {
      setBusy(false);
    }
  };

  const retryQueued = async () => {
    setBusy(true);
    try {
      updateWhatsAppConfig({
        enabled,
        provider,
        defaultCountryCode: countryCode.replace(/\D/g, '') || '91',
        metaPhoneNumberId: phoneNumberId.trim(),
        metaAccessToken: accessToken.trim(),
        metaApiVersion: apiVersion.trim() || 'v21.0',
      });
      const result = await flushWhatsAppOutbox();
      Alert.alert(
        'Retry done',
        `Attempted ${result.attempted} · Sent ${result.sent} · Failed ${result.failed}`
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Title>WhatsApp to parents</Title>
        <Subtitle>Meta Cloud API · auto-send on fee / test / absence</Subtitle>

        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.section}>Enabled</Text>
            <Switch value={enabled} onValueChange={setEnabled} />
          </View>
          <Text style={styles.help}>
            When on, collecting a fee, adding a test score, or marking a student
            absent (first time that day) enqueues a WhatsApp to the guardian.
          </Text>
        </Card>

        <Card>
          <Text style={styles.section}>Provider</Text>
          <View style={styles.chipRow}>
            <Chip
              label="Meta Cloud"
              selected={provider === 'meta_cloud'}
              onPress={() => setProvider('meta_cloud')}
              color="#128C7E"
            />
            <Chip
              label="Stub (demo)"
              selected={provider === 'stub'}
              onPress={() => setProvider('stub')}
              color="#64748b"
            />
          </View>
          <Text style={styles.help}>
            Stub marks messages sent locally without calling Meta — useful for
            offline demo. Default for real phones is Meta Cloud.
          </Text>
        </Card>

        <Card>
          <Text style={styles.section}>Credentials</Text>
          <Label>Country code (digits, no +)</Label>
          <Field
            value={countryCode}
            onChangeText={setCountryCode}
            keyboardType="number-pad"
            placeholder="91"
            autoCapitalize="none"
          />
          <Label>Phone Number ID</Label>
          <Field
            value={phoneNumberId}
            onChangeText={setPhoneNumberId}
            placeholder="From Meta WhatsApp → API Setup"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Label>Access Token</Label>
          <Field
            value={accessToken}
            onChangeText={setAccessToken}
            placeholder="Temporary or permanent token"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Label>API version</Label>
          <Field
            value={apiVersion}
            onChangeText={setApiVersion}
            placeholder="v21.0"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.help, { marginTop: 10 }]}>
            Meta Business Suite → WhatsApp → API Setup: copy Phone number ID and
            a token. Add guardian numbers as test recipients in Meta while in
            development. Cold outbound outside the 24h window needs approved
            message templates; this build sends free-form text (works after the
            parent messages first, or switch to template API later).
          </Text>
          <Text style={[styles.help, { marginTop: 8, color: '#b45309' }]}>
            Demo only: token is stored on-device. Production should move the
            token to a Supabase Edge Function / Render; the app should only
            enqueue.
          </Text>
        </Card>

        <PrimaryButton title="Save" onPress={save} disabled={busy} color="#128C7E" />
        <PrimaryButton
          title="Send test to first student's guardian"
          onPress={sendTest}
          disabled={busy}
          color="#0f766e"
        />
        <PrimaryButton
          title="Retry queued"
          onPress={retryQueued}
          disabled={busy}
          color="#475569"
        />

        <Card>
          <Text style={styles.section}>Recent outbox (last 30)</Text>
          {recent.length === 0 ? (
            <Text style={styles.help}>No messages yet.</Text>
          ) : (
            recent.map((item) => (
              <View key={item.id} style={styles.outboxRow}>
                <View style={styles.rowBetween}>
                  <Text style={styles.kind}>{templateKindLabel(item.kind)}</Text>
                  <StatusPill status={item.status} />
                </View>
                <Text style={styles.meta}>
                  {studentName(item.studentId)} · {item.guardianPhone || '—'}
                </Text>
                <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
                {item.error ? <Text style={styles.err}>{item.error}</Text> : null}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    queued: { bg: '#fef3c7', fg: '#92400e' },
    sending: { bg: '#e0e7ff', fg: '#3730a3' },
    sent: { bg: '#dcfce7', fg: '#15803d' },
    failed: { bg: '#fee2e2', fg: '#b91c1c' },
    skipped: { bg: '#f1f5f9', fg: '#475569' },
  };
  const c = colors[status] ?? colors.skipped;
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}> 
      <Text style={[styles.pillText, { color: c.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  help: { color: '#64748b', fontSize: 13, lineHeight: 18 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  outboxRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  kind: { fontWeight: '800', fontSize: 14, color: '#0f172a' },
  meta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  err: { color: '#b91c1c', fontSize: 12, marginTop: 4 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
});
