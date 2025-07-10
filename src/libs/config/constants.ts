export const COLORS = {
  BORDER: '#272729',
  BLOCK: '#57363D',
  CURVE: '#13AE5C',
  BACKGROUND: '#1a1a1a',
  TEXT: '#ffffff',
  ACCENT: '#13AE5C'
} as const;

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200
} as const;

export const HTTP_CONFIG = {
  URL: process.env.REACT_APP_HTTP_URL || 'https://bananazone.app/feed/SOL_USD',
  POLL_INTERVAL: Number(process.env.REACT_APP_POLL_INTERVAL) || 1000,
  TIMEOUT: Number(process.env.REACT_APP_TIMEOUT) || 5000,
  MAX_DATA_POINTS: Number(process.env.REACT_APP_MAX_DATA_POINTS) || 1000
} as const;
