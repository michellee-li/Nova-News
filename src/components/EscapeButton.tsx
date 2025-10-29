// src/components/EscapeButton.tsx
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Pressable, StyleSheet } from 'react-native';

export default function EscapeButton() {
  const navigation = useNavigation();

  const handleEscape = async () => {
    navigation.navigate('NewsList' as never);

    // logout after 3-5 second delay
    setTimeout(async () => {
      await SecureStore.deleteItemAsync('USER_EMAIL');
      console.log('User logged out');
    }, 4000);
  };

  return (
    <Pressable onPress={handleEscape} style={styles.btn}>
      <Feather name="x-circle" size={26} color="#475569" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 999,
    padding: 6,
  },
});
