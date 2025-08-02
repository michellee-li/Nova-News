// src/screens/Onboarding/FinishScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingParamList } from '../../navigation/OnboardingNavigator';

type Props = StackScreenProps<OnboardingParamList,'Finish'> & {
  onFinish: () => void;
};

export default function FinishScreen({ onFinish }: Props) {
  useEffect(() => {
    SecureStore.setItemAsync('hasOnboarded','true')
      .then(onFinish);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Set!</Text>
      <Text style={styles.body}>
        Your personalized Nova News is ready. Tap below to view headlines.
      </Text>
      <Button title="View Headlines" onPress={onFinish}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1,justifyContent:'center',padding:24 },
  header:   { fontSize:24,fontWeight:'bold',marginBottom:12 },
  body:     { fontSize:16,marginBottom:24 }
});
