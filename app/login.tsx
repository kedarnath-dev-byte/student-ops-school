import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.brand}>Student Ops</Text>
        <Text style={styles.tagline}>School operations · 3-partner pot</Text>
        <Text style={styles.heading}>Who is using the app?</Text>
        <Text style={styles.hint}>
          Every fee and expense will be stamped with the partner you pick. No anonymous cash.
        </Text>
        {partners.map((p) => (
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
              <Text style={styles.sub}>Tap to act as this partner</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1e3a5f' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  brand: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center' },
  tagline: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 14,
  },
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  hint: { color: '#cbd5e1', marginBottom: 20, lineHeight: 20 },
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
