import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { runOnJS, useFrameCallback, useSharedValue } from 'react-native-reanimated';

// Dev-only frame-time HUD (`?fps=1` / dev flag): counts UI-thread frames with
// useFrameCallback - the thread Reanimated worklets and Skia property
// evaluation run on - and reports fps per half-second window plus cumulative
// frames dropped past 1.5x the 60Hz budget. Use it with the release-build pan
// benchmark (scripts/perf-pan.ps1); numbers from dev builds are not
// representative.
const DROP_THRESHOLD_MS = 1.5 * (1000 / 60);
const PUBLISH_WINDOW_MS = 500;

export function AtlasFpsHud() {
  const [stats, setStats] = useState({ fps: 0, dropped: 0, total: 0 });
  const windowFrames = useSharedValue(0);
  const windowStart = useSharedValue(-1);
  const totalFrames = useSharedValue(0);
  const droppedFrames = useSharedValue(0);

  const publish = useCallback((fps: number, dropped: number, total: number) => {
    setStats({ fps, dropped, total });
  }, []);

  useFrameCallback((info) => {
    const dt = info.timeSincePreviousFrame;
    if (dt === null || windowStart.value < 0) {
      windowStart.value = info.timestamp;
      windowFrames.value = 0;
      return;
    }
    windowFrames.value += 1;
    totalFrames.value += 1;
    if (dt > DROP_THRESHOLD_MS) droppedFrames.value += 1;
    const elapsed = info.timestamp - windowStart.value;
    if (elapsed >= PUBLISH_WINDOW_MS) {
      runOnJS(publish)(Math.round((windowFrames.value * 1000) / elapsed), droppedFrames.value, totalFrames.value);
      windowStart.value = info.timestamp;
      windowFrames.value = 0;
    }
  });

  return (
    <View pointerEvents="none" style={styles.root} testID="atlas-fps-hud">
      <Text style={styles.text}>{`UI ${stats.fps} fps · dropped ${stats.dropped}/${stats.total}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 74,
    left: 12,
    zIndex: 90,
    backgroundColor: 'rgba(10, 8, 20, 0.72)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: { color: '#B7F27C', fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '700' },
});
