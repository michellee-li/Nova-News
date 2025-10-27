// src/navigation/OnboardingNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

// ⬇️ Lazy-load each screen
const WelcomeScreen       = React.lazy(() => import('../screens/Onboarding/WelcomeScreen'));
const FavoriteYearScreen  = React.lazy(() => import('../screens/Onboarding/FavoriteYearScreen'));
const BackupYearScreen    = React.lazy(() => import('../screens/Onboarding/BackupYearScreen'));
const FinishScreen        = React.lazy(() => import('../screens/Onboarding/FinishScreen'));

export type OnboardingParamList = {
  Welcome:      undefined;
  FavoriteYear: undefined;
  BackupYear:   undefined;
  Finish:       undefined;
};

const Stack = createStackNavigator<OnboardingParamList>();

function Fallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function OnboardingNavigator({ onFinish }: { onFinish: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome">
        {(props) => (
          <React.Suspense fallback={<Fallback />}>
            <WelcomeScreen {...props} />
          </React.Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen name="FavoriteYear">
        {(props) => (
          <React.Suspense fallback={<Fallback />}>
            <FavoriteYearScreen {...props} />
          </React.Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen name="BackupYear">
        {(props) => (
          <React.Suspense fallback={<Fallback />}>
            <BackupYearScreen {...props} />
          </React.Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen name="Finish">
        {(props) => (
          <React.Suspense fallback={<Fallback />}>
            <FinishScreen {...props} onFinish={onFinish} />
          </React.Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
