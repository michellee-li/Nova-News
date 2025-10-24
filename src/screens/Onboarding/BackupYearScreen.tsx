// src/screens/Onboarding/BackupYearScreen.tsx
import { StackScreenProps } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardingParamList } from '../../navigation/OnboardingNavigator';

console.log('*** in BackupYearScreen.tsx ***');

type Props = StackScreenProps<OnboardingParamList,'BackupYear'>;

export default function BackupYearScreen({ navigation }: Props) {
  const [year, setYear] = useState('');

  const save = async () => {
    if (year.length === 4) {
      await SecureStore.setItemAsync('BACKUP_PIN', year);
      navigation.navigate('Finish');
    } else {
      navigation.navigate('Finish');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add a Backup Year (Optional)</Text>
      <Text style={styles.body}>
        Use this as a decoy PIN to show only year-specific news.
      </Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        placeholder="YYYY"
        value={year}
        onChangeText={setYear}
      />
      <Button title="Finish" onPress={save}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1,justifyContent:'center',padding:24 },
  header:   { fontSize:24,fontWeight:'bold',marginBottom:12 },
  body:     { fontSize:16,marginBottom:24 },
  input:    { fontSize:24,borderBottomWidth:1,marginBottom:24,textAlign:'center' }
});
