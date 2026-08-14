import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View, type NativeSyntheticEvent, type ViewProps } from 'react-native';

import type { AtlasSceneProps } from './AtlasScene.skia';

type WebWheelEvent = NativeSyntheticEvent<{ deltaY: number; offsetX?: number; offsetY?: number }>;
const WheelView = View as unknown as ComponentType<ViewProps & { onWheel?: (event: WebWheelEvent) => void }>;

export default function AtlasSceneWeb(props: AtlasSceneProps) {
  const handleWheel = (event: WebWheelEvent) => {
    const amount = event.nativeEvent.deltaY < 0 ? 0.16 : -0.16;
    props.camera.zoomAt(event.nativeEvent.offsetX ?? props.camera.width / 2, event.nativeEvent.offsetY ?? props.camera.height / 2, amount);
  };

  return (
    <WheelView onWheel={handleWheel} style={styles.root}>
      <WithSkiaWeb
        componentProps={props}
        fallback={<View style={styles.loading}><Text style={styles.loadingText}>Loading Atlas...</Text></View>}
        getComponent={() => import('./AtlasScene.skia')}
        opts={{ locateFile: (file) => file === 'canvaskit.wasm' ? '/canvaskit.wasm' : file }}
      />
    </WheelView>
  );
}

export type { AtlasSceneProps } from './AtlasScene.skia';

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#2F6E4E', fontSize: 12, fontWeight: '700' },
});
