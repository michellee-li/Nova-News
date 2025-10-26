// ResetPassword.tsx
import { BASE_URL_ANDROID, BASE_URL_IOS } from '@env';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function ResetPassword({ navigation }: any) {
  const [token, setToken] = useState<string>('');      // used only for deep-link flow
  const [newPass, setNewPass] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

useEffect(() => {
  (async () => {
    // If using Expo mobile deep link (still keep for mobile fallback)
    const url = await Linking.getInitialURL();
    const parsed = Linking.parse(url ?? '');

    // Check web URL hash fragment (e.g. #access_token=...&refresh_token=...)
    const hashParams = new URLSearchParams(window?.location?.hash.substring(1));

    const accessToken =
      hashParams.get('access_token') ||
      (parsed.queryParams?.access_token as string) ||
      (parsed.queryParams?.token as string) ||
      (parsed.queryParams?.token_hash as string) ||
      '';

    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Set session from the access token
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        Alert.alert('Auth error', error.message);
      } else {
        setToken(accessToken); // allow form to appear
      }
    } else if (accessToken) {
      // Just in case user only has access_token (no refresh)
      setToken(accessToken);
    }
  })();
}, []);


  // 1) Send the reset email (this is what you need now)
  const sendResetEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email.');
      return;
    }
    try {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://nova-news.onrender.com/reset-password',
      });
      if (error) throw error;
      Alert.alert('Email sent', 'Check your inbox for a password reset link.');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  // 2) Deep-link reset (optional). If you stick to the HTTPS page, you don’t need to use this.
  const submitNewPassword = async () => {
    if (!token || !newPass) {
      Alert.alert('Missing', 'Token or new password missing.');
      return;
    }
    try {
      setBusy(true);
      const DEFAULT = 'https://nova-news.onrender.com';
      const resolvedBase = Platform.OS === 'ios' ? (BASE_URL_IOS || DEFAULT) : (BASE_URL_ANDROID || DEFAULT);
      const res = await fetch(`${resolvedBase}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token, new_password: newPass }),
      });
      if (!res.ok) {
        const text = await res.text();
        let detail: any = {};
        try { detail = JSON.parse(text); } catch {}
        const msg = detail?.detail?.message ?? detail?.error ?? text ?? 'Unknown error';
        throw new Error(msg);
      }
      Alert.alert('Success', 'Password updated. Please log in.');
      navigation.replace('PinLogin');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  // UI: email form (for sending link) + optional “enter new password” if token present via deep link
  return (
    <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', padding: 24 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {!token ? (
        <View>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>Reset your password</Text>
          <TextInput
            keyboardType="email-address"
            placeholder="Your email"
            value={email}
            onChangeText={setEmail}
            editable={!busy}
            autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 12 }}
          />
          <Button title="Send reset link" onPress={sendResetEmail} disabled={busy} />
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>Enter new password</Text>
          <TextInput
            secureTextEntry
            placeholder="New password"
            value={newPass}
            onChangeText={setNewPass}
            editable={!busy}
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 12 }}
          />
          <Button title="Set new password" onPress={submitNewPassword} disabled={busy} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
