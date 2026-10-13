export const DEFAULT_PRIMARY_COLOR = '#E5B652';

export interface ThemeColorSet {
  primary: string;
  light: string;
  dark: string;
}

export const THEME_COLOR_MAP: Record<string, ThemeColorSet> = {
  '#E5B652': { primary: '#E5B652', light: '#FEF9EE', dark: '#854D0E' },
  '#3B82F6': { primary: '#3B82F6', light: '#EFF6FF', dark: '#1D4ED8' },
  '#10B981': { primary: '#10B981', light: '#ECFDF5', dark: '#047857' },
  '#8B5CF6': { primary: '#8B5CF6', light: '#F5F3FF', dark: '#6D28D9' },
  '#F43F5E': { primary: '#F43F5E', light: '#FFF1F2', dark: '#BE123C' },
  '#F97316': { primary: '#F97316', light: '#FFF7ED', dark: '#C2410C' },
};

export const THEME_COLOR_PRESETS = [
  '#E5B652', // Hairlines Gold (Default)
  '#3B82F6', // Electric Blue
  '#10B981', // Emerald Green
  '#8B5CF6', // Royal Purple
  '#F43F5E', // Rose Coral
  '#F97316', // Sunset Orange
] as const;

export const Colors = {
  // Primary Brand (Dynamic Theme)
  ButtonPrimaryColor: '#E5B652',
  ButtonPrimaryLeft: '#E5B652',
  ButtonPrimaryRight: '#F0C96F',
  ButtonTextColor: '#0F172A',

  // Controls & Accents
  RadioActive: '#E5B652',
  RadioInactive: '#999999',
  gold: '#E5B652',
  accent: '#222D63',
  accentLight: '#FEF9EE',
  accentDark: '#854D0E',

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
  orange: '#F97316',
  cyan: '#06B6D4',
  lightGrayBorder: '#E2E8F0',
  veryLightGray: '#F1F5F9',
  placeholderGray: '#94A3B8',
};

export function setThemePrimaryColor(color: string) {
  const upper = color.toUpperCase();
  const set = THEME_COLOR_MAP[upper] || THEME_COLOR_MAP[color] || {
    primary: color,
    light: '#FEF9EE',
    dark: color,
  };
  Colors.ButtonPrimaryColor = set.primary;
  Colors.ButtonPrimaryLeft = set.primary;
  Colors.RadioActive = set.primary;
  Colors.gold = set.primary;
  Colors.accentLight = set.light;
  Colors.accentDark = set.dark;
}

export type ColorsType = typeof Colors;
