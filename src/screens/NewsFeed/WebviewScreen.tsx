// src/screens/NewsFeed/WebviewScreen.tsx

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

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
