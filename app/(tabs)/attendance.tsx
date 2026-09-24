import { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Screen, Title, Subtitle, Chip, Card, Label, Field } from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import { CLASS_OPTIONS } from '../../src/store/seed';
import type { AttendanceStatus } from '../../src/store/types';
import { todayISO, formatDate } from '../../src/lib/format';

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; color: string; bg: string }
> = {
  present: { label: 'P', color: '#15803d', bg: '#dcfce7' },
  absent: { label: 'A', color: '#b91c1c', bg: '#fee2e2' },
  late: { label: 'L', color: '#a16207', bg: '#fef9c3' },
};

type Mode = 'class' | 'history';

export default function AttendanceScreen() {
  const [mode, setMode] = useState<Mode>('class');
  const [className, setClassName] = useState(CLASS_OPTIONS[4]); // '3' as default mid
  const [date, setDate] = useState(todayISO());
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);

  const students = useMockStore((s) => s.students);
  const upsertAttendance = useMockStore((s) => s.upsertAttendance);
  const getAttendanceForClassDate = useMockStore((s) => s.getAttendanceForClassDate);
  const getAttendanceForStudent = useMockStore((s) => s.getAttendanceForStudent);
  const activePartnerId = useMockStore((s) => s.activePartnerId);

  const classStudents = useMemo(
    () =>
      students
        .filter((s) => s.className === className)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, className]
  );

  const allStudentsSorted = useMemo(
    () =>
      [...students].sort(
        (a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name)
      ),
    [students]
  );

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO();

  const records = getAttendanceForClassDate(className, validDate);
  const statusMap = useMemo(() => {
    const m: Record<string, AttendanceStatus> = {};
    for (const r of records) m[r.studentId] = r.status;
    return m;
  }, [records]);

  const studentHistory = historyStudentId
    ? getAttendanceForStudent(historyStudentId)
    : [];

  const mark = (studentId: string, status: AttendanceStatus) => {
    if (!activePartnerId) {
      Alert.alert('Select partner', 'Login as a partner or teacher first.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD.');
      return;
    }
    upsertAttendance({ studentId, className, date, status });
  };

  const markAllPresent = () => {
    if (!activePartnerId) {
      Alert.alert('Select partner', 'Login as a partner or teacher first.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD.');
      return;
    }
    for (const s of classStudents) {
      upsertAttendance({ studentId: s.id, className, date, status: 'present' });
    }
  };

  return (
    <Screen>
      <Title>Attendance</Title>
      <Subtitle>Class roll or one student's date-wise history</Subtitle>

      <View style={styles.modeRow}>
        <Chip
          label="Class roll"
          selected={mode === 'class'}
          onPress={() => setMode('class')}
        />
        <Chip
          label="Student history"
          selected={mode === 'history'}
          onPress={() => setMode('history')}
        />
      </View>

      {mode === 'class' ? (
        <>
          <View style={styles.dateBox}>
            <Label>Date (YYYY-MM-DD)</Label>
            <Field
              value={date}
              onChangeText={setDate}
              placeholder={todayISO()}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {CLASS_OPTIONS.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={c === className}
                onPress={() => setClassName(c)}
              />
            ))}
          </ScrollView>

          <Pressable style={styles.bulk} onPress={markAllPresent}>
            <Text style={styles.bulkText}>Mark all Present</Text>
          </Pressable>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {classStudents.length === 0 ? (
              <Card>
                <Text style={styles.empty}>
                  No students in {className}. Add them in Students tab.
                </Text>
              </Card>
            ) : (
              classStudents.map((s) => {
                const current = statusMap[s.id];
                return (
                  <Card key={s.id}>
                    <Text style={styles.name}>{s.name}</Text>
                    <View style={styles.row}>
                      {(Object.keys(STATUS_META) as AttendanceStatus[]).map((st) => {
                        const meta = STATUS_META[st];
                        const selected = current === st;
                        return (
                          <Pressable
                            key={st}
                            onPress={() => mark(s.id, st)}
                            style={[
                              styles.statusBtn,
                              { backgroundColor: selected ? meta.color : meta.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusLabel,
                                { color: selected ? '#fff' : meta.color },
                              ]}
                            >
                              {meta.label}
                            </Text>
                            <Text
                              style={[
                                styles.statusFull,
                                { color: selected ? '#fff' : meta.color },
                              ]}
                            >
                              {st}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Card>
                );
              })
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.sectionPad}>Pick a student</Text>
          <View style={styles.chipsWrap}>
            {allStudentsSorted.map((s) => (
              <Chip
                key={s.id}
                label={`${s.name} (${s.className})`}
                selected={historyStudentId === s.id}
                onPress={() => setHistoryStudentId(s.id)}
              />
            ))}
          </View>

          {!historyStudentId ? (
            <Card>
              <Text style={styles.empty}>Select a student to see attendance by date.</Text>
            </Card>
          ) : studentHistory.length === 0 ? (
            <Card>
              <Text style={styles.empty}>No attendance records yet.</Text>
            </Card>
          ) : (
            studentHistory.map((r) => {
              const meta = STATUS_META[r.status];
              return (
                <Card key={r.id}>
                  <View style={styles.histRow}>
                    <Text style={styles.histDate}>{formatDate(r.date)}</Text>
                    <View style={[styles.histBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.histStatus, { color: meta.color }]}>
                        {r.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>Class {r.className} · {r.date}</Text>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  dateBox: { paddingHorizontal: 16, marginBottom: 4 },
  chips: { paddingHorizontal: 16, paddingVertical: 8 },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  bulk: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#dbeafe',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  bulkText: { color: '#1e3a5f', fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  statusLabel: { fontSize: 22, fontWeight: '900' },
  statusFull: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  empty: { color: '#64748b', textAlign: 'center' },
  sectionPad: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  histRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histDate: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  histBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  histStatus: { fontWeight: '800', textTransform: 'capitalize', fontSize: 13 },
  meta: { color: '#64748b', marginTop: 6, fontSize: 13 },
});
