import type { TypographyVariantsOptions } from '@mui/material/styles';

export const fontFamily = [
  'Roboto', '"Noto Sans SC"', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"',
  'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'
].join(', ');

const scale = (size: number, lineHeight: number, weight: number, tracking = 0) => ({
  fontSize: `${size / 16}rem`,
  lineHeight: `${lineHeight / 16}rem`,
  fontWeight: weight,
  letterSpacing: `${tracking / 16}rem`
});

/** MUI variants mapped onto the MD3 type scale. */
export const typography: TypographyVariantsOptions = {
  fontFamily,
  h1: scale(45, 52, 400),           // display medium
  h2: scale(36, 44, 400),           // display small
  h3: scale(32, 40, 400),           // headline large
  h4: scale(28, 36, 400),           // headline medium
  h5: scale(24, 32, 400),           // headline small
  h6: scale(22, 28, 500),           // title large
  subtitle1: scale(16, 24, 500, 0.15), // title medium
  subtitle2: scale(14, 20, 500, 0.1),  // title small
  body1: scale(16, 24, 400, 0.5),   // body large
  body2: scale(14, 20, 400, 0.25),  // body medium
  caption: scale(12, 16, 400, 0.4), // body small
  overline: { ...scale(11, 16, 500, 0.5), textTransform: 'none' }, // label small
  button: { ...scale(14, 20, 500, 0.1), textTransform: 'none' }     // label large
};
