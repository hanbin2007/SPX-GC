import type { ColorRoles, CustomColor } from './scheme';

declare module '@mui/material/styles' {
  interface Palette {
    md: ColorRoles;
    live: CustomColor;
    pending: CustomColor;
    ok: CustomColor;
  }
  interface PaletteOptions {
    md?: ColorRoles;
    live?: CustomColor;
    pending?: CustomColor;
    ok?: CustomColor;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides { tonal: true }
}
