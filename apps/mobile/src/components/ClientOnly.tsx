import { type ReactNode, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const subscribe = () => () => undefined;

export function ClientOnly({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  if (Platform.OS !== 'web' || hydrated) return children;

  return (
    <View style={styles.loading}>
      <View style={styles.mark} />
      <Text style={styles.brand}>Life Leveling</Text>
      <Text style={styles.status}>LOADING WORLD</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF3EF' },
  mark: { width: 34, height: 34, borderWidth: 2, borderColor: '#2F7655', borderRadius: 17 },
  brand: { marginTop: 12, color: '#14241C', fontSize: 16, fontWeight: '800', letterSpacing: 0 },
  status: { marginTop: 5, color: '#2F7655', fontSize: 8, fontWeight: '800', letterSpacing: 0 },
});
