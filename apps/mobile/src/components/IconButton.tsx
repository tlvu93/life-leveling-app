import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useLifeTheme } from '@/state/theme-context';

type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
  dimension?: number;
};

export function IconButton({ icon: Icon, label, onPress, active = false, size = 19, dimension = 44 }: IconButtonProps) {
  const { theme } = useLifeTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: dimension, height: dimension },
        { borderColor: theme.borderSoft, backgroundColor: active ? `${theme.green}14` : theme.surface },
        pressed && styles.pressed,
      ]}>
      <View pointerEvents="none">
        <Icon color={active ? theme.green : theme.inkSecondary} size={size} strokeWidth={active ? 2.4 : 1.9} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  pressed: { opacity: 0.68 },
});
