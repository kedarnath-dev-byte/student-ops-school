import { useState } from 'react';
import { ScrollView, Text, StyleSheet, Alert, View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import {
  Screen,
  Card,
  Label,
  Field,
  PrimaryButton,
  Title,
} from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import {
  formatINR,
  formatDateTime,
  formatDate,
  partnerName,
  todayISO,
} from '../../src/lib/format';
import { shareText } from '../../src/lib/shareReport';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const student = useMockStore((s) => s.students.find((x) => x.id === id));
  const partners = useMockStore((s) => s.partners);
  const feeCollections = useMockStore((s) => s.feeCollections);
  const progressNotes = useMockStore((s) => s.progressNotes);
  const addProgressNote = useMockStore((s) => s.addProgressNote);
  const addStudentTest = useMockStore((s) => s.addStudentTest);
  const getTestsForStudent = useMockStore((s) => s.getTestsForStudent);
  const getAttendanceForStudent = useMockStore((s) => s.getAttendanceForStudent);
  const isPartner = useMockStore((s) => s.isPartner());
  const isTeacher = useMockStore((s) => s.isTeacher());

  const [note, setNote] = useState('');
  const [testName, setTestName] = useState('');
  const [scored, setScored] = useState('');
  const [maxMarks, setMaxMarks] = useState('20');
  const [testedAt, setTestedAt] = useState(todayISO());

  if (!student) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Student', headerShown: true }} />
        <Card>
          <Text>Student not found.</Text>
        </Card>
      </Screen>
    );
  }

  const fees = feeCollections
    .filter((f) => f.studentId === student.id)
    .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime());

  const notes = progressNotes
    .filter((n) => n.studentId === student.id)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const tests = getTestsForStudent(student.id);
  const attendance = getAttendanceForStudent(student.id);

  const saveNote = () => {
    if (!isPartner) {
      Alert.alert('Partners only', 'Only partners can add progress notes.');
      return;
    }
    if (!note.trim()) return;
    try {
      addProgressNote(student.id, note.trim());
      setNote('');
      Alert.alert('Saved', 'Progress note added.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const saveTest = () => {
    if (!isPartner) {
      Alert.alert('Partners only', 'Only partners can record tests.');
      return;
    }
    const sc = Number(scored);
    const mx = Number(maxMarks);
    try {
      addStudentTest({
        studentId: student.id,
        testName: testName.trim(),
        scored: sc,
        maxMarks: mx,
        testedAt: testedAt.trim(),
      });
      setTestName('');
      setScored('');
      Alert.alert('Saved', 'Test score recorded.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const shareFees = () => {
    const lines: string[] = [
      `Fee ledger — ${student.name} (${student.className})`,
      `Guardian: ${student.guardianName} · ${student.guardianPhone}`,
      '',
    ];
    const active = fees.filter((f) => !f.voidedAt);
    const total = active.reduce((a, f) => a + f.amount, 0);
    lines.push(`Total collected: ${formatINR(total)}`);
    lines.push('');
    for (const f of fees) {
      const voidTag = f.voidedAt ? ' [VOID]' : '';
      lines.push(
        `${formatDateTime(f.collectedAt)} · ${formatINR(f.amount)} · ${f.method.toUpperCase()} · by ${partnerName(partners, f.collectedBy)}${f.note ? ` · ${f.note}` : ''}${voidTag}`
      );
    }
    if (fees.length === 0) lines.push('(No payments yet)');
    void shareText(`Fees — ${student.name}`, lines.join('\n'));
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: student.name, headerShown: true }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}>
        <Card>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.meta}>
            Class {student.className} · fee {formatINR(student.monthlyFee)}/mo
          </Text>
          <Text style={styles.meta}>
            Guardian: {student.guardianName} · {student.guardianPhone}
          </Text>
          <Text style={styles.meta}>
            Admitted {student.admissionDate} · created by{' '}
            {partnerName(partners, student.createdBy)}
          </Text>
          {student.notes ? <Text style={styles.meta}>{student.notes}</Text> : null}
        </Card>

        {!isTeacher ? (
          <>
            <Title>Tests</Title>
            {isPartner ? (
              <>
                <Card>
                  <Label>Test name</Label>
                  <Field
                    value={testName}
                    onChangeText={setTestName}
                    placeholder="e.g. Math Unit 1"
                  />
                  <View style={styles.row2}>
                    <View style={{ flex: 1 }}>
                      <Label>Score</Label>
                      <Field
                        value={scored}
                        onChangeText={setScored}
                        keyboardType="numeric"
                        placeholder="18"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Label>Max marks</Label>
                      <Field
                        value={maxMarks}
                        onChangeText={setMaxMarks}
                        keyboardType="numeric"
                        placeholder="20"
                      />
                    </View>
                  </View>
                  <Label>Date (YYYY-MM-DD)</Label>
                  <Field
                    value={testedAt}
                    onChangeText={setTestedAt}
                    placeholder={todayISO()}
                    autoCapitalize="none"
                  />
                </Card>
                <PrimaryButton title="Add test score" onPress={saveTest} />
              </>
            ) : null}
            {tests.length === 0 ? (
              <Card>
                <Text style={styles.meta}>No tests recorded yet.</Text>
              </Card>
            ) : (
              tests.map((t) => (
                <Card key={t.id}>
                  <Text style={styles.noteBody}>
                    {t.testName}: {t.scored}/{t.maxMarks}
                  </Text>
                  <Text style={styles.meta}>
                    {formatDate(t.testedAt)} · by {partnerName(partners, t.recordedBy)}
                  </Text>
                  {t.note ? <Text style={styles.meta}>{t.note}</Text> : null}
                </Card>
              ))
            )}

            <Title>Progress notes</Title>
            {isPartner ? (
              <>
                <Card>
                  <Label>New note (optional free text)</Label>
                  <Field
                    value={note}
                    onChangeText={setNote}
                    placeholder="Observation / progress…"
                    multiline
                  />
                </Card>
                <PrimaryButton title="Add note" onPress={saveNote} />
              </>
            ) : null}
            {notes.map((n) => (
              <Card key={n.id}>
                <Text style={styles.noteBody}>{n.note}</Text>
                <Text style={styles.meta}>
                  by {partnerName(partners, n.recordedBy)} · {formatDateTime(n.recordedAt)}
                </Text>
              </Card>
            ))}
          </>
        ) : null}

        <Title>Fee history</Title>
        {!isTeacher ? (
          <PrimaryButton title="Share / Print fee ledger" onPress={shareFees} />
        ) : null}
        {fees.length === 0 ? (
          <Card>
            <Text style={styles.meta}>No collections yet.</Text>
          </Card>
        ) : (
          fees.map((f) => (
            <Card key={f.id}>
              <Text style={[styles.feeAmt, f.voidedAt ? styles.voided : null]}>
                {formatINR(f.amount)} · {f.method.toUpperCase()}
              </Text>
              <Text style={styles.meta}>
                by {partnerName(partners, f.collectedBy)} · {formatDateTime(f.collectedAt)}
              </Text>
              {f.voidedAt ? (
                <Text style={styles.voidReason}>VOID: {f.voidReason}</Text>
              ) : null}
            </Card>
          ))
        )}

        <Title>Attendance history</Title>
        {attendance.length === 0 ? (
          <Card>
            <Text style={styles.meta}>No attendance yet.</Text>
          </Card>
        ) : (
          attendance.map((r) => (
            <Card key={r.id}>
              <Text style={styles.noteBody}>
                {formatDate(r.date)} · {r.status}
              </Text>
              <Text style={styles.meta}>
                Class {r.className} · {r.date}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 6, fontSize: 13, lineHeight: 18 },
  noteBody: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
  feeAmt: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  voided: { textDecorationLine: 'line-through', color: '#94a3b8' },
  voidReason: { color: '#b91c1c', marginTop: 6, fontWeight: '600', fontSize: 12 },
  row2: { flexDirection: 'row' },
});
