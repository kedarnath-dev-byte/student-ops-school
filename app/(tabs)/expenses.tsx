import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert, Pressable } from 'react-native';
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
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../src/store/seed';
import type { ExpenseCategory, PaymentMethod } from '../../src/store/types';
import { formatINR, formatDateTime, partnerName } from '../../src/lib/format';

export default function ExpensesScreen() {
  const partners = useMockStore((s) => s.partners);
  const expenses = useMockStore((s) => s.expenses);
  const addExpense = useMockStore((s) => s.addExpense);
  const voidExpense = useMockStore((s) => s.voidExpense);
  const activePartnerId = useMockStore((s) => s.activePartnerId);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('supplies');
  const [purpose, setPurpose] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');

  const recent = useMemo(
    () =>
      [...expenses].sort(
        (a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime()
      ),
    [expenses]
  );

  const submit = () => {
    if (!activePartnerId) {
      Alert.alert('Select partner', 'Login as a partner first.');
      return;
    }
    const n = Number(amount);
    if (!n || n <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive amount.');
      return;
    }
    if (!purpose.trim()) {
      Alert.alert('Purpose required', 'Describe what the money was spent on.');
      return;
    }
    try {
      addExpense({ amount: n, category, purpose: purpose.trim(), method });
      Alert.alert('Saved', `Expense ${formatINR(n)} · stamped with active partner`);
      setAmount('');
      setPurpose('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const onVoid = (id: string) => {
    try {
      voidExpense(id, 'Entered in error');
      Alert.alert('Voided', 'Soft-deleted with reason.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Title>Add expense</Title>
        <Subtitle>Any partner can spend from the shared pot · must record who + why</Subtitle>

        <Card>
          <Label>Amount (₹)</Label>
          <Field
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 1200"
          />

          <Label>Category</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {EXPENSE_CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>

          <Label>Purpose</Label>
          <Field
            value={purpose}
            onChangeText={setPurpose}
            placeholder="What was this for?"
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
        </Card>

        <PrimaryButton title="Save expense" onPress={submit} color="#b45309" />

        <Title>Recent expenses</Title>
        {recent.map((e) => {
          const voided = !!e.voidedAt;
          return (
            <Card key={e.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, voided && styles.voided]}>
                    {formatINR(e.amount)} · {e.category}
                  </Text>
                  <Text style={styles.meta}>{e.purpose}</Text>
                  <Text style={styles.meta}>
                    {e.method.toUpperCase()} · by {partnerName(partners, e.spentBy)} ·{' '}
                    {formatDateTime(e.spentAt)}
                  </Text>
                  {voided ? (
                    <Text style={styles.voidReason}>VOID: {e.voidReason}</Text>
                  ) : null}
                </View>
                {!voided ? (
                  <Pressable onPress={() => onVoid(e.id)} hitSlop={8}>
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
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4, fontSize: 13 },
  voided: { textDecorationLine: 'line-through', color: '#94a3b8' },
  voidReason: { color: '#b91c1c', marginTop: 6, fontWeight: '600', fontSize: 12 },
  voidBtn: { color: '#b91c1c', fontWeight: '800', padding: 8 },
});
