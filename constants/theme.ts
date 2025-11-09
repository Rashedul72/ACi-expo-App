/**
 * Professional theme colors for ACI Logistics Limited (Shwapno)
 * Barcode Scanner App
 */

import { Platform, Dimensions } from 'react-native';

// Shwapno brand colors
const primaryColor = '#00A859'; // Shwapno Green
const primaryDark = '#008548';
const primaryLight = '#4ECB7A';
const secondaryColor = '#0066CC';
const accentColor = '#FF6B35';

const tintColorLight = primaryColor;
const tintColorDark = primaryLight;

export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#666666',
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    tint: tintColorLight,
    primary: primaryColor,
    primaryDark: primaryDark,
    primaryLight: primaryLight,
    secondary: secondaryColor,
    accent: accentColor,
    icon: '#687076',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorLight,
    border: '#E1E8ED',
    success: '#00A859',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#0066CC',
    card: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    tint: tintColorDark,
    primary: primaryLight,
    primaryDark: primaryColor,
    primaryLight: '#6ED89A',
    secondary: '#3385FF',
    accent: '#FF8C5F',
    icon: '#9BA1A6',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorDark,
    border: '#2C2C2C',
    success: '#4ECB7A',
    error: '#FF6B6B',
    warning: '#FFB84D',
    info: '#4DA6FF',
    card: '#1E1E1E',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Responsive utilities
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

export const responsiveWidth = (percentage: number) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

export const responsiveHeight = (percentage: number) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

export const responsiveFontSize = (size: number) => {
  const scale = SCREEN_WIDTH / 375; // Base width
  const newSize = size * scale;
  if (isSmallDevice) {
    return Math.max(newSize * 0.9, size * 0.85);
  } else if (isLargeDevice) {
    return Math.min(newSize * 1.1, size * 1.15);
  }
  return newSize;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};
