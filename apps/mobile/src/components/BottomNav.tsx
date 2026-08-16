import { Compass, Orbit, Telescope, Users } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLifeTheme } from '@/state/theme-context';

const items: { label: string; href: Href; icon: LucideIcon }[] = [
  { label: 'Atlas', href: '/atlas', icon: Orbit },
  { label: 'Discover', href: '/discover', icon: Telescope },
  { label: 'Quest', href: '/quest', icon: Compass },
  { label: 'Community', href: '/community', icon: Users },
];

function NavItem({ label, href, icon: Icon, active, compact }: { label: string; href: Href; icon: LucideIcon; active: boolean; compact: boolean }) {
  const router = useRouter();
  const { theme } = useLifeTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => router.navigate(href)}
      style={({ pressed }) => [styles.item, compact && styles.itemCompact, pressed && styles.pressed]}>
      {hovered && Platform.OS === 'web' && !compact && <View style={styles.middleHover} />}
      <Icon color={active ? theme.accent : theme.navInk} size={compact ? 23 : 26} strokeWidth={active ? 2.3 : 1.8} />
      <Text style={[styles.itemLabel, compact && styles.itemLabelCompact, { color: active ? theme.accent : theme.navInk }]}>{label}</Text>
      {active && <View style={[styles.activeLine, compact && styles.activeLineCompact, { backgroundColor: theme.accent }]} />}
    </Pressable>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { width, height: viewportHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useLifeTheme();
  const compact = width < 720 || viewportHeight < 520;
  const height = compact ? 67 + insets.bottom : 64;
  const dockWidth = compact ? width : Math.min(820, Math.max(320, width - 40));
  const dockLeft = compact ? 0 : (width - dockWidth) / 2;

  return (
    <View testID="bottom-nav" style={[styles.outer, !compact && styles.outerWide, { height, width: dockWidth, left: dockLeft, bottom: compact ? 0 : 18 }]}>
      {compact ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.nav, borderTopColor: theme.borderSoft, borderTopWidth: 1 }]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.pill, { backgroundColor: theme.nav, borderColor: theme.panelBorder }]} />
      )}
      <View style={[styles.items, compact && { paddingBottom: insets.bottom }]}>
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(String(item.href));
          return <NavItem key={item.label} {...item} active={active} compact={compact} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', zIndex: 60 },
  outerWide: { shadowColor: '#1E2951', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  pill: { borderWidth: 1, borderRadius: 32 },
  items: { flex: 1, flexDirection: 'row', paddingHorizontal: 25 },
  item: { position: 'relative', flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 4 },
  itemCompact: { flexDirection: 'column', gap: 1, paddingTop: 6, paddingBottom: 5 },
  itemLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0 },
  itemLabelCompact: { fontSize: 9 },
  activeLine: { position: 'absolute', right: 24, bottom: 6, left: 24, height: 3.5, borderRadius: 2 },
  activeLineCompact: { right: 5, bottom: 1, left: 5, height: 3 },
  middleHover: { position: 'absolute', top: 6, right: 4, bottom: 6, left: 4, borderRadius: 24, backgroundColor: 'rgba(94,72,190,0.07)' },
  pressed: { opacity: 0.7 },
});
