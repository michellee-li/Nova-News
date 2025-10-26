// App.tsx
// MUST be first (before React or anything that uses gestures)
import 'react-native-gesture-handler';
// Reanimated should be imported before other React Native code
import 'react-native-reanimated';

import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from './ErrorBoundary';

// Your existing navigators
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';

// (Temporarily not using linking to rule it out as a release-only issue)
// const linking = { ... }

export default function App() {
  const [loading, setLoading] = React.useState(true);
  const [hasOnboarded, setHasOnboarded] = React.useState(false);

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
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
        {/* --- PROBE BANNER (remove after we confirm prod works) --- */}
        <View style={{ paddingTop: 50, paddingHorizontal: 16 }}>
          <View style={{ backgroundColor: '#ddd', padding: 8, borderRadius: 8 }}>
            <Text>Boot step 1: JS mounted (prod)</Text>
          </View>
        </View>

        {/* Linking prop removed for this build */}
        <NavigationContainer>
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
