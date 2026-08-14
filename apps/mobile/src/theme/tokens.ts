export type ThemeMode = 'living' | 'night';

export const clusterColors = {
  music: '#E86555',
  technology: '#0798A6',
  visual: '#D08A08',
  nature: '#4DA665',
  movement: '#7B87D3',
  purpose: '#C45B9A',
  crossroads: '#3B8463',
} as const;

const shared = {
  coral: '#E86555',
  teal: '#0798A6',
  green: '#357B59',
  violet: '#6246CE',
  amber: '#D08A08',
  pink: '#C94E91',
  radiusSmall: 6,
  radiusMedium: 8,
  touchTarget: 44,
};

export const themes = {
  living: {
    ...shared,
    mode: 'living' as const,
    ink: '#17241E',
    inkSecondary: '#52645A',
    surface: 'rgba(250, 252, 249, 0.96)',
    surfaceStrong: '#FAFCF9',
    surfaceMuted: 'rgba(231, 239, 234, 0.94)',
    border: '#A8B7AE',
    borderSoft: 'rgba(94, 113, 101, 0.28)',
    nav: 'rgba(250, 250, 252, 0.96)',
    navInk: '#202B53',
    canvasScrim: 'rgba(238, 245, 240, 0.14)',
    route: '#2F7D59',
    routeGlow: 'rgba(47, 125, 89, 0.24)',
    relation: 'rgba(52, 80, 68, 0.28)',
    guide: '#615FBE',
    focus: '#6246CE',
    success: '#3B8C61',
  },
  night: {
    ...shared,
    mode: 'night' as const,
    ink: '#F2F6EF',
    inkSecondary: '#AFC0B4',
    surface: 'rgba(12, 24, 18, 0.96)',
    surfaceStrong: '#0D1712',
    surfaceMuted: 'rgba(24, 46, 34, 0.96)',
    border: '#4A6253',
    borderSoft: 'rgba(161, 190, 171, 0.24)',
    nav: 'rgba(250, 250, 252, 0.97)',
    navInk: '#202B53',
    canvasScrim: 'rgba(1, 10, 6, 0.84)',
    route: '#C7F05A',
    routeGlow: 'rgba(199, 240, 90, 0.3)',
    relation: 'rgba(190, 211, 197, 0.28)',
    guide: '#8487F0',
    focus: '#C7F05A',
    success: '#74D887',
  },
} as const;

export type AppTheme = (typeof themes)[ThemeMode];
