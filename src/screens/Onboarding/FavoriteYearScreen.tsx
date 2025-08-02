// src/screens/Onboarding/FavoriteYearScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingParamList } from '../../navigation/OnboardingNavigator';

type Props = StackScreenProps<OnboardingParamList,'FavoriteYear'>;

export default function FavoriteYearScreen({ navigation }: Props) {
  const [pin, setPin] = useState('');
  const save = async () => {
    if (pin.length === 4) {
      await SecureStore.setItemAsync('PRIMARY_PIN', pin);
      navigation.navigate('BackupYear');
    } else alert('Enter exactly 4 digits');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose a 4-digit PIN</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        placeholder="1234"
        value={pin}
        onChangeText={setPin}
      />
      <Button title="Next" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1,justifyContent:'center',padding:24 },
  header:   { fontSize:24,fontWeight:'bold',marginBottom:12 },
  input:    { fontSize:24,borderBottomWidth:1,marginBottom:24,textAlign:'center' }
});
