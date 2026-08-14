import { Compass, Orbit, Telescope, Users } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLifeTheme } from '@/state/theme-context';

const items: { label: string; href: Href; icon: LucideIcon }[] = [
  { label: 'Atlas', href: '/', icon: Orbit },
  { label: 'Discover', href: '/discover', icon: Telescope },
  { label: 'Quest', href: '/quest', icon: Compass },
  { label: 'Community', href: '/community', icon: Users },
];

function NavItem({ label, href, icon: Icon, active, compact }: { label: string; href: Href; icon: LucideIcon; active: boolean; compact: boolean }) {
  const router = useRouter();
  const { theme } = useLifeTheme();
  const [hovered, setHovered] = useState(false);
  const itemIndex = items.findIndex((item) => item.label === label);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => router.navigate(href)}
      style={({ pressed }) => [styles.item, compact && styles.itemCompact, pressed && styles.pressed]}>
      {hovered && Platform.OS === 'web' && !compact && (
        itemIndex === 0 || itemIndex === items.length - 1 ? (
          <Svg
            height="100%"
            preserveAspectRatio="none"
            style={[styles.endHover, itemIndex === 0 ? styles.firstHover : styles.lastHover]}
            viewBox="0 0 218 64"
            width="100%">
            <Path
              d={itemIndex === 0
                ? 'M38 0H218V64H10Q-1 64 2 54L18 15Q23 0 38 0Z'
                : 'M0 0H180Q195 0 200 15L216 54Q219 64 208 64H0Z'}
              fill="rgba(94,72,190,0.07)"
            />
          </Svg>
        ) : <View style={styles.middleHover} />
      )}
      <Icon color={active ? theme.violet : theme.navInk} size={compact ? 23 : 29} strokeWidth={active ? 2.4 : 1.9} />
      <Text style={[styles.itemLabel, compact && styles.itemLabelCompact, { color: active ? theme.violet : theme.navInk }]}>{label}</Text>
      {active && <View style={[styles.activeLine, compact && styles.activeLineCompact, { backgroundColor: theme.violet }]} />}
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
        <Svg height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 820 64" width="100%">
          <Path
            d="M38 1H782Q797 1 802 15L818 53Q821 63 810 63H10Q-1 63 2 53L18 15Q23 1 38 1Z"
            fill={theme.nav}
            stroke="rgba(210,215,229,0.96)"
          />
        </Svg>
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
  items: { flex: 1, flexDirection: 'row', paddingHorizontal: 25 },
  item: { position: 'relative', flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 4 },
  itemCompact: { flexDirection: 'column', gap: 1, paddingTop: 6, paddingBottom: 5 },
  itemLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0 },
  itemLabelCompact: { fontSize: 9 },
  activeLine: { position: 'absolute', right: 16, bottom: 4, left: 16, height: 4, borderRadius: 2 },
  activeLineCompact: { right: 5, bottom: 1, left: 5, height: 3 },
  middleHover: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(94,72,190,0.07)' },
  endHover: { position: 'absolute', top: 0, bottom: 0 },
  firstHover: { right: 0, left: -25 },
  lastHover: { right: -25, left: 0 },
  pressed: { opacity: 0.7 },
});
