import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from './ErrorBoundary'; // optional – you can remove this wrapper later

import AppNavigator from './src/navigation/AppNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';

const linking = {
  prefixes: ['novanews://', 'https://my-nova-news.netlify.app'],
  config: {
    screens: { ResetPassword: 'auth/callback' },
  },
};

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
    <ErrorBoundary>{/* ← remove this wrapper if you don't want it */}
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
