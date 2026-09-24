import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PartnerBanner } from '../../src/components/PartnerBanner';
import { View } from 'react-native';
import { useMockStore } from '../../src/store/mockStore';

export default function TabsLayout() {
  const isTeacher = useMockStore((s) => s.isTeacher());

  return (
    <View style={{ flex: 1 }}>
      <PartnerBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1e3a5f',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarStyle: { minHeight: 58, paddingBottom: 6, paddingTop: 4 },
        }}
      >
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkbox-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="students"
          options={{
            title: 'Students',
            href: isTeacher ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="fees"
          options={{
            title: 'Fees',
            href: isTeacher ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Expenses',
            href: isTeacher ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: isTeacher ? 'Account' : 'More',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
