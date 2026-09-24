import { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import {
  Screen,
  Title,
  Subtitle,
  Card,
  Label,
  Field,
  Chip,
  PrimaryButton,
} from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import { PAYMENT_METHODS } from '../../src/store/seed';
import type { PaymentMethod } from '../../src/store/types';
import { formatINR, formatDateTime, partnerName } from '../../src/lib/format';

export default function FeesScreen() {
  const isTeacher = useMockStore((s) => s.isTeacher());
  const students = useMockStore((s) => s.students);
  const partners = useMockStore((s) => s.partners);
  const feeCollections = useMockStore((s) => s.feeCollections);
  const collectFee = useMockStore((s) => s.collectFee);
  const voidFee = useMockStore((s) => s.voidFee);
  const activePartnerId = useMockStore((s) => s.activePartnerId);

  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  const selected = students.find((s) => s.id === studentId);

  const recent = useMemo(
    () =>
      [...feeCollections].sort(
        (a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
      ),
    [feeCollections]
  );

  if (isTeacher) {
    return (
      <Screen>
        <Title>Fees locked</Title>
        <Subtitle>Teachers can only take attendance.</Subtitle>
        <Card>
          <Text style={{ color: '#64748b', lineHeight: 20 }}>
            Switch to a Partner login to collect fees or record expenses.
          </Text>
        </Card>
      </Screen>
    );
  }

  const submit = () => {
    if (!activePartnerId) {
      Alert.alert('Select partner', 'Login as a partner first.');
      return;
    }
    if (!studentId) {
      Alert.alert('Pick student', 'Select a student to collect fee from.');
      return;
    }
    const n = Number(amount);
    if (!n || n <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive amount.');
      return;
    }
    try {
      collectFee({ studentId, amount: n, method, note: note.trim() || undefined });
      Alert.alert('Saved', `Collected ${formatINR(n)} · stamped with active partner`);
      setAmount('');
      setNote('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const onVoid = (id: string) => {
    Alert.prompt?.(
      'Void fee',
      'Reason required (soft-delete only)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: (reason?: string) => {
            try {
              voidFee(id, reason ?? 'Voided');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
            }
          },
        },
      ],
      'plain-text'
    );
    // Android fallback if Alert.prompt missing
    if (!Alert.prompt) {
      try {
        voidFee(id, 'Entered in error');
        Alert.alert('Voided', 'Marked void with reason: Entered in error');
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
      }
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Title>Collect fee</Title>
        <Subtitle>Any partner can collect from any student · shared pot</Subtitle>

        <Card>
          <Label>Student</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: 600 }}>
              {students.map((s) => (
                <Chip
                  key={s.id}
                  label={`${s.name.split(' ')[0]} (${s.className})`}
                  selected={studentId === s.id}
                  onPress={() => {
                    setStudentId(s.id);
                    if (!amount) setAmount(String(s.monthlyFee));
                  }}
                />
              ))}
            </View>
          </ScrollView>
          {selected ? (
            <Text style={styles.hint}>
              Monthly fee {formatINR(selected.monthlyFee)} · guardian {selected.guardianName}
            </Text>
          ) : null}

          <Label>Amount (₹)</Label>
          <Field
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 2500"
          />

          <Label>Method</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {PAYMENT_METHODS.map((m) => (
              <Chip
                key={m}
                label={m.toUpperCase()}
                selected={method === m}
                onPress={() => setMethod(m)}
              />
            ))}
          </View>

          <Label>Note (optional)</Label>
          <Field value={note} onChangeText={setNote} placeholder="March fee / partial…" />
        </Card>

        <PrimaryButton title="Save collection" onPress={submit} color="#16a34a" />

        <Title>Recent collections</Title>
        {recent.map((f) => {
          const stu = students.find((s) => s.id === f.studentId);
          const voided = !!f.voidedAt;
          return (
            <Card key={f.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, voided && styles.voided]}>
                    {stu?.name ?? f.studentId} · {formatINR(f.amount)}
                  </Text>
                  <Text style={styles.meta}>
                    {f.method.toUpperCase()} · by {partnerName(partners, f.collectedBy)} ·{' '}
                    {formatDateTime(f.collectedAt)}
                  </Text>
                  {f.note ? <Text style={styles.meta}>{f.note}</Text> : null}
                  {voided ? (
                    <Text style={styles.voidReason}>VOID: {f.voidReason}</Text>
                  ) : null}
                </View>
                {!voided ? (
                  <Pressable onPress={() => onVoid(f.id)} hitSlop={8}>
                    <Text style={styles.voidBtn}>Void</Text>
                  </Pressable>
                ) : null}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: '#64748b', marginTop: 4, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4, fontSize: 13 },
  voided: { textDecorationLine: 'line-through', color: '#94a3b8' },
  voidReason: { color: '#b91c1c', marginTop: 6, fontWeight: '600', fontSize: 12 },
  voidBtn: { color: '#b91c1c', fontWeight: '800', padding: 8 },
});
