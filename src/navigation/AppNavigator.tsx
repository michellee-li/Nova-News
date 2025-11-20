// src/navigation/AppNavigator.tsx (TEMP VERSION)

// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import NewsList from '../screens/NewsFeed/NewsList';
// import { RootStackParamList } from './AppNavigatorTypesOrWherever'; // adjust to your actual types

// const RootStack = createStackNavigator<RootStackParamList>();

// export default function AppNavigator() {
//   return (
//     <RootStack.Navigator initialRouteName="NewsList">
//       <RootStack.Screen name="NewsList" component={NewsList} />
//     </RootStack.Navigator>
//   );
// }



// src/navigation/AppNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import PinLogin from '../screens/Auth/PinLogin';
import ResetPassword from '../screens/Auth/ResetPassword';
import NewsList from '../screens/NewsFeed/NewsList';
import WebviewScreen from '../screens/NewsFeed/WebviewScreen';
import OnboardingNavLL from './OnboardingNavigator';
import PrivateTabs from './PrivateTabs';

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
    <Stack.Screen name="NewsList" component={NewsList} />
    <Stack.Screen name="PinLogin" component={PinLogin} />
    <Stack.Screen name="WebviewScreen" component={WebviewScreen} options={{ headerShown: true, title: 'Article' }} />
    <Stack.Screen name="PrivateTabs" component={PrivateTabs} />
    <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
      {({ navigation }) => (
        <OnboardingNavLL onFinish={() => navigation.replace('PrivateTabs')} />
      )}
    </Stack.Screen>
    <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ headerShown: true, title: 'Reset Password' }} />
    </Stack.Navigator>
  );
}
