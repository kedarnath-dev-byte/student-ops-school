import { useState } from 'react';
import { ScrollView, Alert, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  Screen,
  Card,
  Label,
  Field,
  Chip,
  PrimaryButton,
} from '../../src/components/ui';
import { useMockStore } from '../../src/store/mockStore';
import { CLASS_OPTIONS } from '../../src/store/seed';
import { todayISO } from '../../src/lib/format';

export default function AddStudentScreen() {
  const router = useRouter();
  const addStudent = useMockStore((s) => s.addStudent);
  const activePartnerId = useMockStore((s) => s.activePartnerId);

  const [name, setName] = useState('');
  const [className, setClassName] = useState(CLASS_OPTIONS[0]);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('2000');
  const [notes, setNotes] = useState('');

  const submit = () => {
    if (!activePartnerId) {
      Alert.alert('Select partner', 'Login as a partner first.');
      return;
    }
    if (!name.trim() || !guardianName.trim()) {
      Alert.alert('Missing fields', 'Name and guardian are required.');
      return;
    }
    const fee = Number(monthlyFee);
    if (!fee || fee < 0) {
      Alert.alert('Invalid fee', 'Enter a valid monthly fee.');
      return;
    }
    try {
      const s = addStudent({
        name: name.trim(),
        className,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        admissionDate: todayISO(),
        monthlyFee: fee,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Added', s.name);
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Add Student', headerShown: true }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
        <Card>
          <Label>Student name</Label>
          <Field value={name} onChangeText={setName} placeholder="Full name" autoFocus />

          <Label>Class</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CLASS_OPTIONS.map((c) => (
              <Chip key={c} label={c} selected={className === c} onPress={() => setClassName(c)} />
            ))}
          </View>

          <Label>Guardian name</Label>
          <Field value={guardianName} onChangeText={setGuardianName} placeholder="Parent / guardian" />

          <Label>Guardian phone</Label>
          <Field
            value={guardianPhone}
            onChangeText={setGuardianPhone}
            placeholder="10-digit mobile"
            keyboardType="phone-pad"
          />

          <Label>Monthly fee (₹)</Label>
          <Field
            value={monthlyFee}
            onChangeText={setMonthlyFee}
            keyboardType="numeric"
            placeholder="2000"
          />

          <Label>Notes</Label>
          <Field value={notes} onChangeText={setNotes} placeholder="Optional" />
        </Card>
        <PrimaryButton title="Save student" onPress={submit} />
      </ScrollView>
    </Screen>
  );
}
