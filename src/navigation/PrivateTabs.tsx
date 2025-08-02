// src/navigation/PrivateTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BudgetScreen    from '../screens/Private/BudgetScreen';
import ChatbotScreen   from '../screens/Private/ChatbotScreen';
import ResourceList    from '../screens/Private/ResourceList';

const Tab = createBottomTabNavigator();

export default function PrivateTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Budget"   component={BudgetScreen} />
      <Tab.Screen name="Chatbot"  component={ChatbotScreen} />
      <Tab.Screen name="Resources" component={ResourceList} />
    </Tab.Navigator>
  );
}
