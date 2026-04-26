// V2 "Calm" design tokens — single source of truth for caregiver app + watch
// simulator + presentation deck. Mirror these in firmware C macros (see
// apps/firmware/main/ui/ui_theme.c).

export const APP = {
  // surfaces
  bg:           '#F4EFE6',
  bgSoft:       '#EDE6DB',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F9F5EE',
  border:       'rgba(58,58,63,0.08)',
  borderStrong: 'rgba(58,58,63,0.16)',

  // ink
  ink:      '#2E2E33',
  ink2:     '#56565E',
  inkDim:   '#8A8A92',
  inkFaint: '#B6B6BC',

  // semantic
  brand:      '#7FA38E',
  brandSoft:  '#D7E4DB',
  brandInk:   '#1F2E27',
  accent:     '#C99466',
  accentSoft: '#F1E2CF',
  warn:       '#D69A55',
  warnSoft:   '#F4E2C9',
  danger:     '#C77676',
  dangerSoft: '#F1D9D9',
  star:       '#C99B3F',
  starSoft:   '#F1E3C2',
  info:       '#6B8DA8',
  infoSoft:   '#D6E2EB',

  // chart inks
  chart1: '#7FA38E',
  chart2: '#C99466',
  chart3: '#6B8DA8',
  chart4: '#B07F9E',
  chart5: '#A8A268',

  // type
  font:     `'Nunito Sans', 'Nunito', system-ui, -apple-system, sans-serif`,
  fontDisp: `'Nunito', system-ui, -apple-system, sans-serif`,
  fontMono: `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`,

  // shape
  r:   12,
  rLg: 18,
  rXl: 24,

  // shadow
  shadowSm: '0 1px 2px rgba(31,46,39,0.04), 0 1px 1px rgba(31,46,39,0.03)',
  shadow:   '0 4px 12px rgba(31,46,39,0.06), 0 1px 2px rgba(31,46,39,0.04)',
  shadowLg: '0 12px 32px rgba(31,46,39,0.08)',
} as const;

export type AppTokens = typeof APP;

// task label → icon map
export const TASK_ICON: Record<string, string> = {
  'Wake Up': 'sun',     'Brush Teeth': 'brush', 'Get Dressed': 'shirt',
  'Breakfast': 'plate', 'Pack Bag': 'bag',      'Math': 'pencil',
  'Reading': 'book',    'Lunch': 'plate',       'Science': 'book',
  'Dinner': 'plate',    'Homework': 'pencil',   'Shower': 'shower',
  'Read': 'book',       'Sleep': 'moon',
};
