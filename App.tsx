// App.tsx
// MUST be first (before React or anything that uses gestures)
import 'react-native-gesture-handler';
// Reanimated should be imported before other React Native code
import 'react-native-reanimated';

import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';

export default function App() {
  // Heartbeat to confirm the JS bundle actually starts
  React.useEffect(() => {
    try { Alert.alert('App started'); } catch {}
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Text style={styles.text}>Hello from production ✅</Text>
        <Text style={styles.note}>
          If you see this screen, JS mounted successfully.
          Next, re-enable navigation/screens step by step.
        </Text>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  note: { fontSize: 14, color: '#666', textAlign: 'center' },
});
