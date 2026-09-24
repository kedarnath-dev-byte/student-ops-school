import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Title,
  Subtitle,
  Card,
  PrimaryButton,
} from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import { formatINR } from '../../src/lib/format';

export default function MoreScreen() {
  const router = useRouter();
  const partners = useMockStore((s) => s.partners);
  const feeBy = useMockStore((s) => s.monthFeeTotalsByPartner);
  const expBy = useMockStore((s) => s.monthExpenseTotalsByPartner);
  const monthNet = useMockStore((s) => s.monthNet);
  const clearActivePartner = useMockStore((s) => s.clearActivePartner);
  const resetToSeed = useMockStore((s) => s.resetToSeed);
  const students = useMockStore((s) => s.students);
  const employees = useMockStore((s) => s.employees);
  const isTeacher = useMockStore((s) => s.isTeacher());

  const fees = feeBy();
  const exps = expBy();
  const net = monthNet();
  const partnerOnly = partners.filter((p) => p.role === 'partner');
  const teachers = partners.filter((p) => p.role === 'teacher');
  const activeEmployees = employees.filter((e) => e.active);

  if (isTeacher) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
          <Title>Teacher account</Title>
          <Subtitle>You can take attendance only</Subtitle>
          <Card>
            <Text style={styles.meta}>
              Fees, expenses, student edits, salaries, tests, and money reports are for partners.
              Use Switch to change who is logged in.
            </Text>
          </Card>
          <PrimaryButton
            title="Switch user"
            onPress={() => {
              clearActivePartner();
              router.replace('/login');
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Title>Partners & reports</Title>
        <Subtitle>Shared school pot · this calendar month</Subtitle>

        <Card>
          <Text style={styles.section}>Quick actions</Text>
          <Text style={styles.meta}>
            {teachers.length} teacher{teachers.length === 1 ? '' : 's'} on login ·{' '}
            {activeEmployees.length} employee{activeEmployees.length === 1 ? '' : 's'} on payroll
          </Text>
        </Card>

        <PrimaryButton title="Add Teacher" onPress={() => router.push('/teachers/add')} />
        <PrimaryButton title="Salaries" onPress={() => router.push('/salaries')} color="#6d28d9" />
        <PrimaryButton
          title="Money reports (Print / Share)"
          onPress={() => router.push('/reports')}
          color="#0f766e"
        />

        <Card>
          <Text style={styles.section}>Money report (this month)</Text>
          <View style={styles.kpiRow}>
            <View style={[styles.kpi, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.kpiLabel}>In (fees)</Text>
              <Text style={[styles.kpiVal, { color: '#15803d' }]}>{formatINR(net.in)}</Text>
            </View>
            <View style={[styles.kpi, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.kpiLabel}>Out (expenses)</Text>
              <Text style={[styles.kpiVal, { color: '#b91c1c' }]}>{formatINR(net.out)}</Text>
            </View>
          </View>
          <View style={[styles.kpi, { backgroundColor: '#e0e7ff', marginTop: 8 }]}>
            <Text style={styles.kpiLabel}>Net</Text>
            <Text style={[styles.kpiVal, { color: '#3730a3' }]}>{formatINR(net.net)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.section}>By partner</Text>
          {partnerOnly.map((p) => (
            <View key={p.id} style={styles.partnerRow}>
              <View style={[styles.dot, { backgroundColor: p.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.partnerName}>{p.name}</Text>
                <Text style={styles.meta}>
                  Collected {formatINR(fees[p.id] ?? 0)} · Spent {formatINR(exps[p.id] ?? 0)}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.section}>Teachers on login</Text>
          {teachers.map((t) => (
            <View key={t.id} style={styles.partnerRow}>
              <View style={[styles.dot, { backgroundColor: t.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.partnerName}>
                  {t.name} ({t.label})
                </Text>
                <Text style={styles.meta}>Attendance only</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.section}>School snapshot</Text>
          <Text style={styles.meta}>
            {students.length} students · {partnerOnly.length} partners · {teachers.length} teachers
          </Text>
          <Text style={[styles.meta, { marginTop: 8 }]}>
            Finance rule: any partner may collect from any student and spend on any school
            expense. Every movement records who acted, amount, method, timestamp. Soft-delete
            only via void + reason.
          </Text>
        </Card>

        <PrimaryButton
          title="Switch user"
          onPress={() => {
            clearActivePartner();
            router.replace('/login');
          }}
        />
        <PrimaryButton
          title="Reset mock data to seed"
          color="#64748b"
          onPress={() => {
            Alert.alert('Reset?', 'Replace all local data with seed demo data.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: () => {
                  resetToSeed();
                  Alert.alert('Done', 'Seed data restored. Pick a user again.');
                  clearActivePartner();
                  router.replace('/login');
                },
              },
            ]);
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpi: { flex: 1, borderRadius: 10, padding: 12 },
  kpiLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  kpiVal: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  partnerName: { fontWeight: '800', fontSize: 15, color: '#0f172a' },
  meta: { color: '#64748b', fontSize: 13, lineHeight: 18 },
});
