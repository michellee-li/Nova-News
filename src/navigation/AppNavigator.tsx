// src/navigation/AppNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const PinLogin        = React.lazy(() => import('../screens/Auth/PinLogin'));
const NewsList        = React.lazy(() => import('../screens/NewsFeed/NewsList'));
const WebviewScreen   = React.lazy(() => import('../screens/NewsFeed/WebviewScreen'));
const OnboardingNavLL = React.lazy(() => import('./OnboardingNavigator'));
const PrivateTabs     = React.lazy(() => import('./PrivateTabs'));
const ResetPassword   = React.lazy(() => import('../screens/Auth/ResetPassword'));

export type RootStackParamList = {
  PinLogin:      undefined;
  NewsList:      undefined;
  WebviewScreen: { uri: string };
  PrivateTabs:   undefined;
  Onboarding:    undefined;
  ResetPassword: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function Fallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="NewsList" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewsList">
        {(props) => (
          <React.Suspense fallback={<Fallback />}>
            <NewsList {...props} />
          </React.Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen name="PinLogin">
        {(props) => (
          <React.Suspense fallback={<Fallback />}>
            <PinLogin {...props} />
          </React.Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="WebviewScreen"
        options={{ headerShown: true, title: 'Article' }}
      >
        {(props) => (
          <React.Suspense fallback={<Fallback />}>
            <WebviewScreen {...props} />
          </React.Suspense>
        )}
      </Stack.Screen>

      {/* ✅ No props for PrivateTabs */}
      <Stack.Screen name="PrivateTabs">
        {() => (
          <React.Suspense fallback={<Fallback />}>
            <PrivateTabs />
          </React.Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
        {({ navigation }) => (
          <React.Suspense fallback={<Fallback />}>
            <OnboardingNavLL onFinish={() => navigation.replace('PrivateTabs')} />
          </React.Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="ResetPassword"
        options={{ headerShown: true, title: 'Reset Password' }}
      >
        {(props) => (
          <React.Suspense fallback={<Fallback />}>
            <ResetPassword {...props} />
          </React.Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
