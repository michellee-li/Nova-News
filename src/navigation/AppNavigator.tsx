// src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PinLogin from '../screens/Auth/PinLogin';
import NewsList from '../screens/NewsFeed/NewsList';
import PrivateTabs from './PrivateTabs';
import WebviewScreen from '../screens/NewsFeed/WebviewScreen';

export type RootStackParamList = {
  PinLogin:    undefined;
  NewsList:    undefined;
  WebviewScreen: { uri: string };
  PrivateTabs: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PinLogin"    component={PinLogin} />
      <Stack.Screen name="NewsList"    component={NewsList} />
      <Stack.Screen
        name="WebviewScreen"
        component={WebviewScreen} 
        options={{ headerShown: true, title: 'Article' }}
      />
      <Stack.Screen name="PrivateTabs" component={PrivateTabs} />
    </Stack.Navigator>
  );
}
