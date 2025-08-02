// App.tsx
import 'react-native-gesture-handler';          // ← MUST be first
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [loading, setLoading]           = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('hasOnboarded')
      .then(flag => {
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
      <NavigationContainer>
        {hasOnboarded
          ? <AppNavigator />
          : <OnboardingNavigator onFinish={() => setHasOnboarded(true)} />
        }
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: { flex:1, justifyContent:'center', alignItems:'center' },
});
