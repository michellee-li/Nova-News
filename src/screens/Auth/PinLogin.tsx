// src/screens/Auth/PinLogin.tsx
import { BASE_URL_ANDROID, BASE_URL_IOS } from '@env';
import { StackScreenProps } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'PinLogin'>;
type Mode = 'login' | 'signup';

export default function PinLogin({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleMode = () => setMode(m => (m === 'login' ? 'signup' : 'login'));

  const resolvedBase = (() => {
    const DEFAULT = 'https://nova-news.onrender.com';
    if (Platform.OS === 'ios') return BASE_URL_IOS || DEFAULT;
    return BASE_URL_ANDROID || DEFAULT;
  })();

  const handleAuth = async () => {
    const e = email.trim();
    const p = password;

    if (!e || !p) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    try {
      setBusy(true);
      const path = mode === 'signup' ? '/api/register' : '/api/login';

      const res = await fetch(`${resolvedBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p }),
      });

      // Safely try to parse JSON, but don't rely on shape
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore parse errors; we'll fall back to friendly copy
      }

      if (!res.ok) {
        // ---- FRIENDLY MESSAGES ONLY (no raw server JSON) ----
        const lower = (s: unknown) =>
          (typeof s === 'string' ? s : String(s ?? '')).toLowerCase();

        const code = lower(data?.error_code || data?.code || data?.error);
        const detail = lower(data?.detail || data?.message || data?.msg);

        let userMsg =
          'We couldn’t sign you in. Please check your email and password and try again.';

        // Common invalid-credentials patterns
        if (code.includes('invalid_credentials') || detail.includes('invalid login credentials')) {
          userMsg = 'Email or password is incorrect.';
        } else if (res.status === 429) {
          userMsg = 'Too many attempts. Please wait a moment and try again.';
        } else if (res.status >= 500) {
          userMsg = 'Server is having trouble right now. Please try again shortly.';
        }

        throw new Error(userMsg);
      }

      if (mode === 'signup') {
        Alert.alert(
          'Account created',
          'Check your email for a confirmation link, then log in.'
        );
        setMode('login');
        return;
      }

      const token = data?.access_token ?? data?.data?.access_token;
      if (token) await SecureStore.setItemAsync('ACCESS_TOKEN', token);
      await SecureStore.setItemAsync('USER_EMAIL', e);

      navigation.replace('Onboarding');
    } catch (err: any) {
      // Will show only the sanitized message from above
      Alert.alert('Authentication failed', err?.message ?? 'Please try again.');
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
      const res = await fetch(`${resolvedBase}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Reset failed (${res.status}): ${text}`);
      }

      Alert.alert(
        'Check your email',
        'If that email exists, we sent a password reset link. Open it on your device.'
      );
    } catch (err: any) {
      Alert.alert('Reset failed', err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>
          {mode === 'login' ? 'Log In' : 'Sign Up'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!busy}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
        />

        <TouchableOpacity
          onPress={handleAuth}
          disabled={busy}
          style={styles.mainButton}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.mainButtonText}>
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        {mode === 'login' && (
          <TouchableOpacity onPress={handleForgotPassword} disabled={busy}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={toggleMode} disabled={busy} style={{ marginTop: 16 }}>
          <Text style={styles.switchText}>
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  card: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  mainButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  mainButtonText: { color: 'white', fontWeight: '600' },
  linkText: { textAlign: 'center', color: '#2563EB', marginTop: 8 },
  switchText: { textAlign: 'center', color: '#0066cc' },
});
