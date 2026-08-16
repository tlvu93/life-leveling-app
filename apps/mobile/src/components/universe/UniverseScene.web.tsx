import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { StyleSheet, Text, View } from 'react-native';

import type { UniverseSceneProps } from './UniverseScene.skia';

/**
 * On web, CanvasKit loads asynchronously. Rendering the scene before it is
 * ready throws inside Skia ("CanvasKit is not defined"), so the whole scene is
 * lazily mounted behind this gate — the same pattern the Atlas uses.
 */
export default function UniverseSceneWeb(props: UniverseSceneProps) {
  return (
    <View style={styles.root}>
      <WithSkiaWeb
        componentProps={props}
        fallback={<View style={styles.loading}><Text style={styles.loadingText}>Loading the Universe...</Text></View>}
        getComponent={() => import('./UniverseScene.skia')}
        opts={{ locateFile: (file) => (file === 'canvaskit.wasm' ? '/canvaskit.wasm' : file) }}
      />
    </View>
  );
}

export type { UniverseSceneProps } from './UniverseScene.skia';

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#2F6E4E', fontSize: 12, fontWeight: '700' },
});
