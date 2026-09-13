export const Colors = {
  // Primary Brand
  ButtonPrimaryColor: '#222D63',
  ButtonPrimaryLeft: '#222D63',
  ButtonPrimaryRight: '#2B76C8',
  ButtonTextColor: '#FFFFFF',

  // Controls & Accents
  RadioActive: '#E5B652',
  RadioInactive: '#999999',
  gold: '#E5B652',
  accent: '#2B76C8',

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
} as const;

export type ColorsType = typeof Colors;
