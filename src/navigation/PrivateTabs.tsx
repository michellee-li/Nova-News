// src/navigation/PrivateTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BudgetScreen from '../screens/Private/BudgetScreen';
import ChatbotScreen from '../screens/Private/ChatbotScreen';
import ResourceList from '../screens/Private/ResourceList';
// import UserScreen from '../screens/Private/UserScreen';

const Tab = createBottomTabNavigator();

export default function PrivateTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Budget"   component={BudgetScreen} />
      <Tab.Screen name="Chatbot"  component={ChatbotScreen} />
      <Tab.Screen name="Resources" component={ResourceList} />
      {/* <Tab.Screen name="User" component={UserScreen}
        options={{
          tabBarLabel: "User",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>👤</Text>,
        }}
      /> */}
    </Tab.Navigator>
  );
}
