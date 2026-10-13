export const DEFAULT_PRIMARY_COLOR = '#222D63';

export interface ThemeColorSet {
  primary: string;
  light: string;
  dark: string;
  secondary: string;
}

export const THEME_COLOR_MAP: Record<string, ThemeColorSet> = {
  '#222D63': { primary: '#222D63', light: '#EEF2FF', dark: '#151D42', secondary: '#2B76C8' },
  '#E5B652': { primary: '#E5B652', light: '#FEF9EE', dark: '#854D0E', secondary: '#F0C96F' },
  '#3B82F6': { primary: '#3B82F6', light: '#EFF6FF', dark: '#1D4ED8', secondary: '#60A5FA' },
  '#10B981': { primary: '#10B981', light: '#ECFDF5', dark: '#047857', secondary: '#34D399' },
  '#8B5CF6': { primary: '#8B5CF6', light: '#F5F3FF', dark: '#6D28D9', secondary: '#A78BFA' },
  '#F43F5E': { primary: '#F43F5E', light: '#FFF1F2', dark: '#BE123C', secondary: '#FB7185' },
};

export const THEME_COLOR_PRESETS = [
  '#222D63', // Classic Navy (Default customer app color from iOS ButtonPrimaryColor)
  '#E5B652', // Hairlines Gold
  '#3B82F6', // Electric Blue
  '#10B981', // Emerald Green
  '#8B5CF6', // Royal Purple
  '#F43F5E', // Rose Coral
] as const;

export const Colors = {
  // Primary Brand (Dynamic Theme)
  ButtonPrimaryColor: '#222D63',
  ButtonPrimaryLeft: '#222D63',
  ButtonPrimaryRight: '#2B76C8',
  ButtonTextColor: '#FFFFFF',

  // Controls & Accents
  RadioActive: '#222D63',
  RadioInactive: '#999999',
  gold: '#E5B652',
  accent: '#222D63',
  accentLight: '#EEF2FF',
  accentDark: '#151D42',

  // Fields
  PlaceholderActive: '#404552',
  PlaceholderInactive: '#94A3B8',
  TextFieldColor: '#F8FAFC',
  BorderColor: '#E2E8F0',

  // Backgrounds
  BGColor: '#FFFFFF',
  PopupBG: '#FFFFFF',
  CardColor: '#FFFFFF',
  ScreenBG: '#F8FAFC',

  // Text
  TitleColor: '#1E293B',
  SectionColor: '#475569',
  DescriptionTextDark: '#64748B',
  DescriptionTextLight: '#94A3B8',
  NavigationTitle: '#1E293B',

  // Semantic
  appThemeBlackColor: '#0F172A',
  errorViewColor: '#EF4444',
  successColor: '#10B981',
  disabledGray: '#E2E8F0',
  disabledText: '#94A3B8',
  orange: '#EE5E29',
  cyan: '#00A9BB',
  lightGrayBorder: '#E2E8F0',
  veryLightGray: '#F1F5F9',
  placeholderGray: '#94A3B8',

  // Slider
  SliderGradient: 'rgba(108, 98, 255, 0.6)',
};

export function setThemePrimaryColor(color: string) {
  const upper = color.toUpperCase();
  const set = THEME_COLOR_MAP[upper] || THEME_COLOR_MAP[color] || {
    primary: color,
    light: '#EEF2FF',
    dark: color,
    secondary: color,
  };
  Colors.ButtonPrimaryColor = set.primary;
  Colors.ButtonPrimaryLeft = set.primary;
  Colors.ButtonPrimaryRight = set.secondary;
  Colors.RadioActive = set.primary;
  Colors.accent = set.primary;
  Colors.accentLight = set.light;
  Colors.accentDark = set.dark;
}

export type ColorsType = typeof Colors;
