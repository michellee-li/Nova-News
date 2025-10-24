// src/screens/Onboarding/WelcomeScreen.tsx
import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { OnboardingParamList } from '../../navigation/OnboardingNavigator';

console.log('*** in WelcomeScreen.tsx ***');

type Props = StackScreenProps<OnboardingParamList,'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to Nova News</Text>
      <Text style={styles.body}>
        This app hides a private finance section.
      </Text>
      <Button title="Get Started" onPress={() => navigation.navigate('Finish')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1,justifyContent:'center',padding:24 },
  header:   { fontSize:24,fontWeight:'bold',marginBottom:12 },
  body:     { fontSize:16,marginBottom:24 }
});
