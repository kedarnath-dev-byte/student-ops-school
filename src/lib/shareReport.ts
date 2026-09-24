import { Alert, Share } from 'react-native';

/** Share plain-text report. On web, fall back to Alert if Share fails. */
export async function shareText(title: string, body: string): Promise<void> {
  const message = `${title}\n\n${body}`;
  try {
    await Share.share({ title, message });
  } catch {
    Alert.alert(title, body.length > 1800 ? `${body.slice(0, 1800)}…` : body);
  }
}
