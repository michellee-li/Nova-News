// src/navigation/AppNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import PinLogin from '../screens/Auth/PinLogin';
import NewsList from '../screens/NewsFeed/NewsList';
import WebviewScreen from '../screens/NewsFeed/WebviewScreen';
import OnboardingNavigator from './OnboardingNavigator';
import PrivateTabs from './PrivateTabs';

import ResetPassword from '../screens/Auth/ResetPassword';

export type RootStackParamList = {
  PinLogin:      undefined;
  NewsList:      undefined;
  WebviewScreen: { uri: string };
  PrivateTabs:   undefined;
  Onboarding:    undefined;
  ResetPassword: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="NewsList" screenOptions={{ headerShown: false }}>
      {/* Public / initial feed */}
      <Stack.Screen name="NewsList" component={NewsList} />

      {/* Auth */}
      <Stack.Screen name="PinLogin" component={PinLogin} />

      {/* Article webview (keeps its header) */}
      <Stack.Screen
        name="WebviewScreen"
        component={WebviewScreen}
        options={{ headerShown: true, title: 'Article' }}
      />

      {/* Private area */}
      <Stack.Screen name="PrivateTabs" component={PrivateTabs} />

      {/* Onboarding flow — use render prop to inject onFinish */}
      <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
        {({ navigation }) => (
          <OnboardingNavigator onFinish={() => navigation.replace('PrivateTabs')} />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{ headerShown: true, title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
}
