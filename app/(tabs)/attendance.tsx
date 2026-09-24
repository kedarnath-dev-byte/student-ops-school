import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Screen, Title, Subtitle, Chip, Card } from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import { CLASS_OPTIONS } from '../../src/store/seed';
import type { AttendanceStatus } from '../../src/store/types';
import { todayISO } from '../../src/lib/format';

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; color: string; bg: string }
> = {
  present: { label: 'P', color: '#15803d', bg: '#dcfce7' },
  absent: { label: 'A', color: '#b91c1c', bg: '#fee2e2' },
  late: { label: 'L', color: '#a16207', bg: '#fef9c3' },
};

export default function AttendanceScreen() {
  const [className, setClassName] = useState(CLASS_OPTIONS[2]);
  const [date] = useState(todayISO());
  const students = useMockStore((s) => s.students);
  const upsertAttendance = useMockStore((s) => s.upsertAttendance);
  const getAttendanceForClassDate = useMockStore((s) => s.getAttendanceForClassDate);
  const activePartnerId = useMockStore((s) => s.activePartnerId);

  const classStudents = useMemo(
    () => students.filter((s) => s.className === className).sort((a, b) => a.name.localeCompare(b.name)),
    [students, className]
  );

  const records = getAttendanceForClassDate(className, date);
  const statusMap = useMemo(() => {
    const m: Record<string, AttendanceStatus> = {};
    for (const r of records) m[r.studentId] = r.status;
    return m;
  }, [records]);

  const mark = (studentId: string, status: AttendanceStatus) => {
    if (!activePartnerId) {
      Alert.alert('Select partner', 'Login as a partner first.');
      return;
    }
    upsertAttendance({ studentId, className, date, status });
  };

  const markAllPresent = () => {
    if (!activePartnerId) {
      Alert.alert('Select partner', 'Login as a partner first.');
      return;
    }
    for (const s of classStudents) {
      upsertAttendance({ studentId: s.id, className, date, status: 'present' });
    }
  };

  return (
    <Screen>
      <Title>Attendance</Title>
      <Subtitle>
        {date} · recorded by active partner · big buttons for quick mark
      </Subtitle>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CLASS_OPTIONS.map((c) => (
          <Chip key={c} label={c} selected={c === className} onPress={() => setClassName(c)} />
        ))}
      </ScrollView>

      <Pressable style={styles.bulk} onPress={markAllPresent}>
        <Text style={styles.bulkText}>Mark all Present</Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {classStudents.length === 0 ? (
          <Card>
            <Text style={styles.empty}>No students in {className}. Add them in Students tab.</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: 16, paddingVertical: 8 },
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
  statusFull: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },
  empty: { color: '#64748b', textAlign: 'center' },
});
