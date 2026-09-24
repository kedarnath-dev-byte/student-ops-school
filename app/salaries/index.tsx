import { useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, Alert } from 'react-native';
import { Stack } from 'expo-router';
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
import { formatINR, formatDateTime, partnerName, todayISO } from '../../src/lib/format';

export default function SalariesScreen() {
  const isPartner = useMockStore((s) => s.isPartner());
  const isTeacher = useMockStore((s) => s.isTeacher());
  const partners = useMockStore((s) => s.partners);
  const employees = useMockStore((s) => s.employees);
  const salaryPayments = useMockStore((s) => s.salaryPayments);
  const addEmployee = useMockStore((s) => s.addEmployee);
  const recordSalary = useMockStore((s) => s.recordSalary);
  const voidSalary = useMockStore((s) => s.voidSalary);

  const [empName, setEmpName] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('bank');
  const [periodLabel, setPeriodLabel] = useState(todayISO().slice(0, 7));
  const [note, setNote] = useState('');

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.active),
    [employees]
  );

  const history = useMemo(
    () =>
      [...salaryPayments].sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
      ),
    [salaryPayments]
  );

  if (isTeacher || !isPartner) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Salaries', headerShown: true }} />
        <Card>
          <Text style={styles.meta}>Partners only — teachers cannot manage salaries.</Text>
        </Card>
      </Screen>
    );
  }

  const saveEmployee = () => {
    if (!empName.trim()) {
      Alert.alert('Missing name', 'Enter employee name.');
      return;
    }
    try {
      const sal = empSalary.trim() ? Number(empSalary) : undefined;
      if (empSalary.trim() && (!sal || sal < 0)) {
        Alert.alert('Invalid salary', 'Enter a valid monthly salary or leave blank.');
        return;
      }
      const e = addEmployee({
        name: empName.trim(),
        title: empTitle.trim() || undefined,
        monthlySalary: sal,
      });
      setEmpName('');
      setEmpTitle('');
      setEmpSalary('');
      setSelectedEmpId(e.id);
      Alert.alert('Added', e.name);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const paySalary = () => {
    if (!selectedEmpId) {
      Alert.alert('Pick employee', 'Select who you are paying.');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive amount.');
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(periodLabel.trim())) {
      Alert.alert('Period', 'Use YYYY-MM (e.g. 2026-03).');
      return;
    }
    try {
      recordSalary({
        employeeId: selectedEmpId,
        amount: amt,
        method,
        periodLabel: periodLabel.trim(),
        note: note.trim() || undefined,
      });
      setAmount('');
      setNote('');
      Alert.alert('Recorded', 'Salary payment saved.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const onVoid = (id: string) => {
    const doVoid = (reason: string) => {
      try {
        voidSalary(id, reason.trim() || 'Voided');
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
      }
    };
    if (typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Void salary',
        'Reason required',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Void',
            style: 'destructive',
            onPress: (reason?: string) => doVoid(reason ?? 'Voided'),
          },
        ],
        'plain-text'
      );
      return;
    }
    Alert.alert('Void salary?', 'This soft-voids the payment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Void',
        style: 'destructive',
        onPress: () => doVoid('Voided by partner'),
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Salaries', headerShown: true }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}>
        <Title>Employees & salaries</Title>
        <Subtitle>Record who was paid, amount, method, period</Subtitle>

        <Card>
          <Text style={styles.section}>Add employee</Text>
          <Label>Name</Label>
          <Field value={empName} onChangeText={setEmpName} placeholder="Full name" />
          <Label>Title (optional)</Label>
          <Field value={empTitle} onChangeText={setEmpTitle} placeholder="e.g. Class teacher" />
          <Label>Monthly salary ₹ (optional)</Label>
          <Field
            value={empSalary}
            onChangeText={setEmpSalary}
            keyboardType="numeric"
            placeholder="15000"
          />
        </Card>
        <PrimaryButton title="Add employee" onPress={saveEmployee} />

        <Text style={styles.sectionPad}>Employees ({activeEmployees.length})</Text>
        <View style={styles.chips}>
          {activeEmployees.map((e) => (
            <Chip
              key={e.id}
              label={e.name}
              selected={selectedEmpId === e.id}
              onPress={() => {
                setSelectedEmpId(e.id);
                if (e.monthlySalary) setAmount(String(e.monthlySalary));
              }}
            />
          ))}
        </View>

        <Card>
          <Text style={styles.section}>Pay salary</Text>
          <Label>Amount ₹</Label>
          <Field value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="15000" />
          <Label>Period (YYYY-MM)</Label>
          <Field value={periodLabel} onChangeText={setPeriodLabel} placeholder="2026-03" />
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
          <Field value={note} onChangeText={setNote} placeholder="March salary" />
        </Card>
        <PrimaryButton title="Record salary payment" onPress={paySalary} />

        <Text style={styles.sectionPad}>Payment history</Text>
        {history.length === 0 ? (
          <Card>
            <Text style={styles.meta}>No salary payments yet.</Text>
          </Card>
        ) : (
          history.map((p) => {
            const emp = employees.find((e) => e.id === p.employeeId);
            return (
              <Card key={p.id}>
                <Text style={[styles.lineAmt, p.voidedAt ? styles.voided : null]}>
                  {emp?.name ?? p.employeeId} · {formatINR(p.amount)} · {p.method.toUpperCase()}
                </Text>
                <Text style={styles.meta}>
                  Period {p.periodLabel} · by {partnerName(partners, p.paidBy)} ·{' '}
                  {formatDateTime(p.paidAt)}
                </Text>
                {p.note ? <Text style={styles.meta}>{p.note}</Text> : null}
                {p.voidedAt ? (
                  <Text style={styles.voidReason}>VOID: {p.voidReason}</Text>
                ) : (
                  <PrimaryButton
                    title="Void"
                    color="#b91c1c"
                    onPress={() => onVoid(p.id)}
                  />
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  sectionPad: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  lineAmt: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  meta: { color: '#64748b', fontSize: 13, marginTop: 4, lineHeight: 18 },
  voided: { textDecorationLine: 'line-through', color: '#94a3b8' },
  voidReason: { color: '#b91c1c', marginTop: 6, fontWeight: '600', fontSize: 12 },
});
