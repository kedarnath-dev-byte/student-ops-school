import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useMockStore } from '../store/mockStore';

export function PartnerBanner() {
  const router = useRouter();
  const partners = useMockStore((s) => s.partners);
  const activePartnerId = useMockStore((s) => s.activePartnerId);
  const partner = partners.find((p) => p.id === activePartnerId);

  if (!partner) {
    return (
      <Pressable style={styles.warn} onPress={() => router.replace('/login')}>
        <Text style={styles.warnText}>Not logged in — tap to choose partner or teacher</Text>
      </Pressable>
    );
  }

  const roleLine =
    partner.role === 'teacher'
      ? `Teacher · attendance only`
      : `Partner · full access`;

  return (
    <View style={[styles.banner, { backgroundColor: partner.color }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>{partner.name}</Text>
        <Text style={styles.sub}>{roleLine}</Text>
      </View>
      <Pressable onPress={() => router.push('/login')} hitSlop={12}>
        <Text style={styles.switch}>Switch</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  switch: { color: '#fff', fontWeight: '600', textDecorationLine: 'underline' },
  warn: {
    backgroundColor: '#b45309',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
