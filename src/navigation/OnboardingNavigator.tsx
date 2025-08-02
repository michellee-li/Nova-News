// src/navigation/OnboardingNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import FavoriteYearScreen from '../screens/Onboarding/FavoriteYearScreen';
import BackupYearScreen from '../screens/Onboarding/BackupYearScreen';
import FinishScreen from '../screens/Onboarding/FinishScreen';

export type OnboardingParamList = {
  Welcome:      undefined;
  FavoriteYear: undefined;
  BackupYear:   undefined;
  Finish:       undefined;
};

const Stack = createStackNavigator<OnboardingParamList>();

export default function OnboardingNavigator({
  onFinish
}: {
  onFinish: () => void;
}) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome"      component={WelcomeScreen} />
      <Stack.Screen name="FavoriteYear" component={FavoriteYearScreen} />
      <Stack.Screen name="BackupYear"   component={BackupYearScreen} />
      <Stack.Screen name="Finish">
        {props => <FinishScreen {...props} onFinish={onFinish} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
