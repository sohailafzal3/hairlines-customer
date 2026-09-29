import { FontTypeface } from '../constants';

export const Fonts = {
  ubuntuRegular: FontTypeface.UbuntuRegular,
  ubuntuMedium: FontTypeface.UbuntuMedium,
  ubuntuBold: FontTypeface.UbuntuBold,
  uberMoveRegular: FontTypeface.UberMoveRegular,
  uberMoveMedium: FontTypeface.UberMoveMedium,
  uberMoveBold: FontTypeface.UberMoveBold,
  uberMoveLight: FontTypeface.UberMoveLight,
  proximaNovaSemibold: FontTypeface.ProximaNovaSemibold,
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};
