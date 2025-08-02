// src/screens/Auth/PinLogin.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'PinLogin'>;

export default function PinLogin({ navigation }: Props) {
  const [pin, setPin]               = useState('');
  const [correctPin, setCorrectPin] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('PRIMARY_PIN')
      .then(p => setCorrectPin(p));
  }, []);

  const tryLogin = () => {
    if (pin === correctPin) {
      navigation.replace('NewsList');
    } else {
      alert('Incorrect PIN');
    }
    setPin('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Enter your 4-digit PIN</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />
      <Button title="Submit" onPress={tryLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:24 },
  header:    { fontSize:20, marginBottom:12, textAlign:'center' },
  input:     { fontSize:24, borderBottomWidth:1, marginBottom:24, textAlign:'center' }
});
