import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Screen, Card, Label, Field, PrimaryButton } from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';

export default function AddTeacherScreen() {
  const router = useRouter();
  const addTeacher = useMockStore((s) => s.addTeacher);
  const isPartner = useMockStore((s) => s.isPartner());
  const [name, setName] = useState('');

  const submit = () => {
    if (!isPartner) {
      Alert.alert('Partners only', 'Only partners can add teachers.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter the teacher name.');
      return;
    }
    try {
      const t = addTeacher({ name: name.trim() });
      Alert.alert('Added', `${t.name} (${t.label}) will appear on the login screen.`);
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Add Teacher', headerShown: true }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
        <Card>
          <Label>Teacher name</Label>
          <Field
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            autoFocus
          />
        </Card>
        <PrimaryButton title="Save teacher" onPress={submit} />
      </ScrollView>
    </Screen>
  );
}
