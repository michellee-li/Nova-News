// src/screens/NewsFeed/WebviewScreen.tsx

import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../../navigation/AppNavigator';

console.log('*** in WebviewScreen.tsx ***');

type Props = StackScreenProps<RootStackParamList, 'WebviewScreen'>;

export default function WebviewScreen({ route }: Props) {
  const { uri } = route.params;
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator style={styles.loader} size="large" />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
