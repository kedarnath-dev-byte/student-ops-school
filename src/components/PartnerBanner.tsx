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
        <Text style={styles.warnText}>No partner selected — tap to login</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: partner.color }]}>
      <Text style={styles.text}>Acting as {partner.name}</Text>
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
  switch: { color: '#fff', fontWeight: '600', textDecorationLine: 'underline' },
  warn: {
    backgroundColor: '#b45309',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
