// PinLogin.tsx
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// If you use react-native-config or expo-constants, swap these imports accordingly.
import { BASE_URL_ANDROID, BASE_URL_IOS } from '@env';

console.log('*** in PinLogin.tsx');

type Props = { navigation: any };

export default function PinLogin({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const resolvedBase = (() => {
    const DEFAULT = 'https://nova-news.onrender.com';
    if (Platform.OS === 'ios') return (BASE_URL_IOS as string) || DEFAULT;
    return (BASE_URL_ANDROID as string) || DEFAULT;
  })();

  const handleLogin = async () => {
    const e = email.trim();
    const p = password;
    if (!e || !p) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    try {
      setBusy(true);
      const res = await fetch(`${resolvedBase}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data?.detail === 'string'
            ? data.detail
            : data?.detail?.message || 'Login failed. Check your credentials.';
        throw new Error(msg);
      }

      const accessToken = data?.access_token ?? data?.data?.access_token;
      const refreshToken = data?.refresh_token;
      if (accessToken) await SecureStore.setItemAsync('ACCESS_TOKEN', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('REFRESH_TOKEN', refreshToken);
      await SecureStore.setItemAsync('USER_EMAIL', e);

      navigation.replace('Onboarding');
    } catch (err: any) {
      Alert.alert('Login error', err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    const e = email.trim();
    if (!e) {
      Alert.alert('Enter email', 'Please enter the email you registered with first.');
      return;
    }

    try {
      setBusy(true);
      // DEBUG: show where we're calling and with what email
      console.log('[FORGOT] base:', resolvedBase, 'email:', e);

      const res = await fetch(`${resolvedBase}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e }),
      });

      if (!res.ok) {
        // DEBUG: capture *everything* the server returned
        let bodyText = '';
        try { bodyText = await res.text(); } catch {}
        let parsed: any = {};
        try { parsed = JSON.parse(bodyText); } catch {}

        const supa =
          typeof parsed?.detail === 'string' ? parsed.detail :
          parsed?.detail?.message ?? parsed?.error ?? bodyText ?? 'Unknown error';

        const debugMsg =
          `Could not start the password reset.\n\n` +
          `HTTP ${res.status}\n` +
          `Endpoint: ${resolvedBase}/api/forgot-password\n` +
          `Email: ${e}\n` +
          `Server said: ${supa}`;

        console.log('[FORGOT][DEBUG]', debugMsg);
        Alert.alert('Reset failed', debugMsg);
        return;
      }

      Alert.alert(
        'Check your email',
        'If that email exists, we sent a password reset link. Open it on your device.'
      );
    } catch (err: any) {
      Alert.alert('Reset failed (client)', err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8 }}>Welcome back</Text>

        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!busy}
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 }}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={busy}
          style={{
            backgroundColor: '#111827',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 6,
          }}
        >
          {busy ? <ActivityIndicator /> : <Text style={{ color: 'white', fontWeight: '600' }}>Log in</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForgotPassword} disabled={busy} style={{ marginTop: 8 }}>
          <Text style={{ textAlign: 'center', color: '#2563EB' }}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
