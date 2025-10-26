// App.tsx
// MUST be first (before React or anything that uses gestures)
import 'react-native-gesture-handler';
// Reanimated should be imported before other React Native code
import 'react-native-reanimated';

import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from './ErrorBoundary';

// Your existing navigators
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';

const linking = {
  // Prefixes your app should respond to:
  prefixes: [
    'novanews://',                        // custom scheme
    'https://my-nova-news.netlify.app',   // web trampoline
  ],
  config: {
    screens: {
      // Map the ResetPassword route to /auth/callback
      // If ResetPassword is nested, keep the same route name in that navigator.
      ResetPassword: 'auth/callback',
      // other routes are discovered normally by the navigator
    },
  },
};

export default function App() {
  const [loading, setLoading] = React.useState(true);
  const [hasOnboarded, setHasOnboarded] = React.useState(false);

  // Heartbeat to confirm JS reached runtime (useful for blank-screen debugging)
  React.useEffect(() => {
    try { Alert.alert('App started'); } catch {}
  }, []);

  React.useEffect(() => {
    SecureStore.getItemAsync('hasOnboarded').then(flag => {
      setHasOnboarded(flag === 'true');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer linking={linking}>
          {hasOnboarded ? (
            <AppNavigator />
          ) : (
            <OnboardingNavigator onFinish={() => setHasOnboarded(true)} />
          )}
        </NavigationContainer>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
