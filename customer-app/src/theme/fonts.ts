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
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;
