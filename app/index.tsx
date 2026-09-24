import { Redirect } from 'expo-router';
import { useMockStore } from '../src/store/mockStore';

export default function Index() {
  const activePartnerId = useMockStore((s) => s.activePartnerId);
  if (activePartnerId) {
    return <Redirect href="/(tabs)/attendance" />;
  }
  return <Redirect href="/login" />;
}
