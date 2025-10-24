// App.tsx
// MUST be first (before React or anything that uses gestures)
import 'react-native-gesture-handler';
// Reanimated should be imported before other React Native code
import 'react-native-reanimated';

import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Add the linking prop */}
      <NavigationContainer linking={linking}>
        {hasOnboarded ? (
          <AppNavigator />
        ) : (
          <OnboardingNavigator onFinish={() => setHasOnboarded(true)} />
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
