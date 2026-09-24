import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMockStore } from '../src/store/mockStore';

export default function LoginScreen() {
  const router = useRouter();
  const partners = useMockStore((s) => s.partners);
  const setActivePartner = useMockStore((s) => s.setActivePartner);

  const select = (id: string) => {
    setActivePartner(id);
    router.replace('/(tabs)/attendance');
  };

  const partnerUsers = partners.filter((p) => p.role === 'partner');
  const teachers = partners.filter((p) => p.role === 'teacher');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>Student Ops</Text>
        <Text style={styles.tagline}>School operations · shared partner pot</Text>

        <Text style={styles.heading}>Partners</Text>
        <Text style={styles.hint}>
          Full access: attendance, students, fees, and expenses. Every rupee is stamped with who
          acted.
        </Text>
        {partnerUsers.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => select(p.id)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: p.color },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[styles.badge, { backgroundColor: p.color }]}>
              <Text style={styles.badgeText}>{p.label}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.sub}>Fees · expenses · attendance</Text>
            </View>
          </Pressable>
        ))}

        <Text style={[styles.heading, { marginTop: 20 }]}>Teacher</Text>
        <Text style={styles.hint}>Attendance only — cannot collect fees or record expenses.</Text>
        {teachers.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => select(p.id)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: p.color },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[styles.badge, { backgroundColor: p.color }]}>
              <Text style={styles.badgeText}>{p.label}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.sub}>Take attendance only</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1e3a5f' },
  container: { padding: 24, paddingBottom: 48 },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginTop: 24,
  },
  tagline: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 28,
    fontSize: 14,
  },
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  hint: { color: '#cbd5e1', marginBottom: 16, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 3,
    minHeight: 72,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  name: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#64748b', marginTop: 2 },
});
