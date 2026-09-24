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
import { formatINR, formatDateTime, partnerName } from '../../src/lib/format';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const student = useMockStore((s) => s.students.find((x) => x.id === id));
  const partners = useMockStore((s) => s.partners);
  const feeCollections = useMockStore((s) => s.feeCollections);
  const progressNotes = useMockStore((s) => s.progressNotes);
  const addProgressNote = useMockStore((s) => s.addProgressNote);
  const activePartnerId = useMockStore((s) => s.activePartnerId);

  const [note, setNote] = useState('');

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

  const saveNote = () => {
    if (!activePartnerId) {
      Alert.alert('Select partner', 'Login as a partner first.');
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

  return (
    <Screen>
      <Stack.Screen options={{ title: student.name, headerShown: true }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}>
        <Card>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.meta}>
            {student.className} · fee {formatINR(student.monthlyFee)}/mo
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

        <Title>Progress notes</Title>
        <Card>
          <Label>New note</Label>
          <Field
            value={note}
            onChangeText={setNote}
            placeholder="Observation / progress…"
            multiline
          />
        </Card>
        <PrimaryButton title="Add note" onPress={saveNote} />
        {notes.map((n) => (
          <Card key={n.id}>
            <Text style={styles.noteBody}>{n.note}</Text>
            <Text style={styles.meta}>
              by {partnerName(partners, n.recordedBy)} · {formatDateTime(n.recordedAt)}
            </Text>
          </Card>
        ))}

        <Title>Fee history</Title>
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
});
