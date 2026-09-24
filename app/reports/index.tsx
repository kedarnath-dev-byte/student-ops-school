import { useMemo, useState } from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Screen,
  Title,
  Subtitle,
  Card,
  Chip,
  PrimaryButton,
} from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import { formatINR, formatDateTime, partnerName, todayISO } from '../../src/lib/format';
import { shareText } from '../../src/lib/shareReport';

type Period = 'day' | 'month' | 'year' | 'all';

function inPeriod(iso: string, period: Period, anchor: string): boolean {
  const d = iso.slice(0, 10);
  if (period === 'all') return true;
  if (period === 'day') return d === anchor;
  if (period === 'month') return d.slice(0, 7) === anchor.slice(0, 7);
  if (period === 'year') return d.slice(0, 4) === anchor.slice(0, 4);
  return true;
}

export default function MoneyReportsScreen() {
  const router = useRouter();
  const isPartner = useMockStore((s) => s.isPartner());
  const isTeacher = useMockStore((s) => s.isTeacher());
  const partners = useMockStore((s) => s.partners);
  const feeCollections = useMockStore((s) => s.feeCollections);
  const expenses = useMockStore((s) => s.expenses);
  const students = useMockStore((s) => s.students);
  const [period, setPeriod] = useState<Period>('month');
  const anchor = todayISO();

  if (isTeacher || !isPartner) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Money reports', headerShown: true }} />
        <Card>
          <Text style={styles.meta}>Partners only — teachers cannot view money reports.</Text>
        </Card>
      </Screen>
    );
  }

  const activeFees = useMemo(
    () =>
      feeCollections.filter(
        (f) => !f.voidedAt && inPeriod(f.collectedAt, period, anchor)
      ),
    [feeCollections, period, anchor]
  );
  const activeExpenses = useMemo(
    () => expenses.filter((e) => !e.voidedAt && inPeriod(e.spentAt, period, anchor)),
    [expenses, period, anchor]
  );

  const feeTotal = activeFees.reduce((a, f) => a + f.amount, 0);
  const expTotal = activeExpenses.reduce((a, e) => a + e.amount, 0);

  const periodLabel =
    period === 'day'
      ? `Day ${anchor}`
      : period === 'month'
        ? `Month ${anchor.slice(0, 7)}`
        : period === 'year'
          ? `Year ${anchor.slice(0, 4)}`
          : 'All years';

  const buildBody = () => {
    const lines: string[] = [
      `Student Ops — Collections & Expenses`,
      `Period: ${periodLabel}`,
      '',
      `FEES IN: ${formatINR(feeTotal)}`,
    ];
    for (const f of activeFees) {
      const stu = students.find((s) => s.id === f.studentId);
      lines.push(
        `  ${formatDateTime(f.collectedAt)} · ${formatINR(f.amount)} · ${f.method.toUpperCase()} · ${stu?.name ?? f.studentId} · by ${partnerName(partners, f.collectedBy)}${f.note ? ` · ${f.note}` : ''}`
      );
    }
    lines.push('', `EXPENSES OUT: ${formatINR(expTotal)}`);
    for (const e of activeExpenses) {
      lines.push(
        `  ${formatDateTime(e.spentAt)} · ${formatINR(e.amount)} · ${e.method.toUpperCase()} · ${e.category} · ${e.purpose} · by ${partnerName(partners, e.spentBy)}`
      );
    }
    lines.push('', `NET: ${formatINR(feeTotal - expTotal)}`);
    return lines.join('\n');
  };

  const onShare = () => {
    void shareText(`Money report — ${periodLabel}`, buildBody());
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Money reports', headerShown: true }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}>
        <Title>Collections & expenses</Title>
        <Subtitle>Filter by period · share as plain text</Subtitle>

        <View style={styles.chips}>
          {(
            [
              ['day', 'Day'],
              ['month', 'Month'],
              ['year', 'Year'],
              ['all', 'All years'],
            ] as [Period, string][]
          ).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              selected={period === key}
              onPress={() => setPeriod(key)}
            />
          ))}
        </View>

        <Card>
          <Text style={styles.section}>{periodLabel}</Text>
          <View style={styles.kpiRow}>
            <View style={[styles.kpi, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.kpiLabel}>Fees in</Text>
              <Text style={[styles.kpiVal, { color: '#15803d' }]}>{formatINR(feeTotal)}</Text>
            </View>
            <View style={[styles.kpi, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.kpiLabel}>Expenses out</Text>
              <Text style={[styles.kpiVal, { color: '#b91c1c' }]}>{formatINR(expTotal)}</Text>
            </View>
          </View>
          <View style={[styles.kpi, { backgroundColor: '#e0e7ff', marginTop: 8 }]}>
            <Text style={styles.kpiLabel}>Net</Text>
            <Text style={[styles.kpiVal, { color: '#3730a3' }]}>
              {formatINR(feeTotal - expTotal)}
            </Text>
          </View>
        </Card>

        <PrimaryButton title="Share / Print report" onPress={onShare} />

        <Text style={styles.sectionPad}>Fee line items ({activeFees.length})</Text>
        {activeFees.length === 0 ? (
          <Card>
            <Text style={styles.meta}>No fee collections in this period.</Text>
          </Card>
        ) : (
          activeFees.map((f) => {
            const stu = students.find((s) => s.id === f.studentId);
            return (
              <Card key={f.id}>
                <Text style={styles.lineAmt}>
                  {formatINR(f.amount)} · {f.method.toUpperCase()}
                </Text>
                <Text style={styles.meta}>
                  {stu?.name ?? f.studentId} · by {partnerName(partners, f.collectedBy)} ·{' '}
                  {formatDateTime(f.collectedAt)}
                </Text>
              </Card>
            );
          })
        )}

        <Text style={styles.sectionPad}>Expense line items ({activeExpenses.length})</Text>
        {activeExpenses.length === 0 ? (
          <Card>
            <Text style={styles.meta}>No expenses in this period.</Text>
          </Card>
        ) : (
          activeExpenses.map((e) => (
            <Card key={e.id}>
              <Text style={styles.lineAmt}>
                {formatINR(e.amount)} · {e.method.toUpperCase()} · {e.category}
              </Text>
              <Text style={styles.meta}>
                {e.purpose} · by {partnerName(partners, e.spentBy)} ·{' '}
                {formatDateTime(e.spentAt)}
              </Text>
            </Card>
          ))
        )}

        <PrimaryButton
          title="Student fee ledgers"
          color="#475569"
          onPress={() => router.push('/students')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  section: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  sectionPad: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpi: { flex: 1, borderRadius: 10, padding: 12 },
  kpiLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  kpiVal: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  lineAmt: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  meta: { color: '#64748b', fontSize: 13, marginTop: 4, lineHeight: 18 },
});
