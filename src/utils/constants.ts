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

export const WEBSOCKET_CONFIG = {
  URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://bananazone.app/feed/SOL_USD',
  RECONNECT_INTERVAL: Number(process.env.REACT_APP_RECONNECT_INTERVAL) || 5000,
  MAX_RECONNECT_ATTEMPTS: Number(process.env.REACT_APP_MAX_RECONNECT_ATTEMPTS) || 10,
  MAX_DATA_POINTS: Number(process.env.REACT_APP_MAX_DATA_POINTS) || 1000
} as const;
