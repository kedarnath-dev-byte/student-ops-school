import { FlatList, Pressable, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Title, Subtitle, PrimaryButton, Card } from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import { formatINR } from '../../src/lib/format';

export default function StudentsScreen() {
  const router = useRouter();
  const students = useMockStore((s) => s.students);
  const sorted = [...students].sort((a, b) =>
    a.className.localeCompare(b.className) || a.name.localeCompare(b.name)
  );

  return (
    <Screen>
      <Title>Students</Title>
      <Subtitle>{students.length} enrolled · tap for detail</Subtitle>
      <PrimaryButton title="+ Add student" onPress={() => router.push('/students/add')} />
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/students/${item.id}`)}>
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.className} · {item.guardianName}
                  </Text>
                </View>
                <Text style={styles.fee}>{formatINR(item.monthlyFee)}/mo</Text>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card>
            <Text style={{ color: '#64748b', textAlign: 'center' }}>No students yet.</Text>
          </Card>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4 },
  fee: { fontWeight: '800', color: '#1e3a5f' },
});
