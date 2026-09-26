import {
  Blend, Hct, SchemeTonalSpot, TonalPalette, argbFromHex, hexFromArgb
} from '@material/material-color-utilities';

/** Brand seed: the teal SPX Studio has always used. */
export const SEED = '#007f78';

const ROLE_NAMES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
  'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer',
  'surfaceContainerHigh', 'surfaceContainerHighest',
  'outline', 'outlineVariant', 'inverseSurface', 'inverseOnSurface', 'inversePrimary',
  'scrim', 'shadow'
] as const;

export type RoleName = typeof ROLE_NAMES[number];
export type ColorRoles = Record<RoleName, string>;

/** A custom color group, harmonised with the seed as MD3 recommends. */
export interface CustomColor { main: string; on: string; container: string; onContainer: string }

export interface Md3Scheme {
  roles: ColorRoles;
  live: CustomColor;
  pending: CustomColor;
  success: CustomColor;
}

function customColor(hex: string, seed: number, dark: boolean, harmonize = true): CustomColor {
  const argb = argbFromHex(hex);
  const palette = TonalPalette.fromInt(harmonize ? Blend.harmonize(argb, seed) : argb);
  const tone = (value: number) => hexFromArgb(palette.tone(value));
  return dark
    ? { main: tone(80), on: tone(20), container: tone(30), onContainer: tone(90) }
    : { main: tone(40), on: tone(100), container: tone(90), onContainer: tone(10) };
}

export function createScheme(dark: boolean, seedHex = SEED): Md3Scheme {
  const seed = argbFromHex(seedHex);
  const scheme = new SchemeTonalSpot(Hct.fromInt(seed), dark, 0);
  const roles = Object.fromEntries(ROLE_NAMES.map((name) =>
    [name, hexFromArgb((scheme as unknown as Record<RoleName, number>)[name])])) as ColorRoles;
  return {
    roles,
    // On-air red is a broadcast convention, so it is deliberately not harmonised.
    live: customColor('#e53935', seed, dark, false),
    pending: customColor('#f9a825', seed, dark),
    success: customColor('#2e7d32', seed, dark)
  };
}
