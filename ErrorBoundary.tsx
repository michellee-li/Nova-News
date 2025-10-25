// ErrorBoundary.tsx
import React, { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

type State = { e?: unknown };
type Props = PropsWithChildren<{}>; // <-- adds `children`

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { e: undefined };

  static getDerivedStateFromError(e: unknown) {
    return { e };
  }

  componentDidCatch(e: unknown, info: unknown) {
    console.log('ErrorBoundary caught:', e, info);
  }

  render() {
    if (this.state.e) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ color: 'red', textAlign: 'center' }}>
            Startup error:{'\n'}{String(this.state.e)}
          </Text>
        </View>
      );
    }
    return this.props.children ?? null; // <-- no cast needed
  }
}
