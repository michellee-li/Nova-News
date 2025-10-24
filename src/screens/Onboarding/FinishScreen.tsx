// src/screens/Onboarding/FinishScreen.tsx
import { StackScreenProps } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { OnboardingParamList } from '../../navigation/OnboardingNavigator';

console.log('*** in FinishScreen.tsx ***');

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
