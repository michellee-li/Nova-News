import React from 'react';
import { Text, View } from 'react-native';

export class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.log('Root error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong.</Text>
          <Text selectable>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
