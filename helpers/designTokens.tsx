/**
 * Centralized design tokens for consistent spacing, colors, and typography
 */

export const designTokens = {
  // Spacing scale
  spacing: {
    xs: 'var(--spacing-1)', // 0.25rem
    sm: 'var(--spacing-2)', // 0.5rem
    md: 'var(--spacing-3)', // 0.75rem
    lg: 'var(--spacing-4)', // 1rem
    xl: 'var(--spacing-6)', // 1.5rem
    '2xl': 'var(--spacing-8)', // 2rem
    '3xl': 'var(--spacing-12)', // 3rem
    '4xl': 'var(--spacing-16)', // 4rem
  },

  // Typography scale
  typography: {
    fontFamily: {
      base: 'var(--font-family-base)',
      heading: 'var(--font-family-heading)',
      mono: 'var(--font-family-monospace)',
      cursive: 'var(--font-family-cursive)',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // Color tokens
  colors: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    surface: 'var(--surface)',
    surfaceForeground: 'var(--surface-foreground)',
    primary: 'var(--primary)',
    primaryForeground: 'var(--primary-foreground)',
    secondary: 'var(--secondary)',
    secondaryForeground: 'var(--secondary-foreground)',
    accent: 'var(--accent)',
    accentForeground: 'var(--accent-foreground)',
    muted: 'var(--muted)',
    mutedForeground: 'var(--muted-foreground)',
    success: 'var(--success)',
    successForeground: 'var(--success-foreground)',
    error: 'var(--error)',
    errorForeground: 'var(--error-foreground)',
    warning: 'var(--warning)',
    warningForeground: 'var(--warning-foreground)',
    info: 'var(--info)',
    infoForeground: 'var(--info-foreground)',
    border: 'var(--border)',
  },

  // Border radius
  borderRadius: {
    sm: 'var(--radius-sm)',
    base: 'var(--radius)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    full: 'var(--radius-full)',
  },

  // Shadows
  shadows: {
    sm: 'var(--shadow)',
    base: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    focus: 'var(--shadow-focus)',
  },

  // Animation durations
  animation: {
    fast: 'var(--animation-duration-fast)',
    normal: 'var(--animation-duration-normal)',
    slow: 'var(--animation-duration-slow)',
  },

  // Z-index scale
  zIndex: {
    contentLow: 'var(--z-content-low)',
    content: 'var(--z-content)',
    contentHigh: 'var(--z-content-high)',
    navLow: 'var(--z-nav-low)',
    nav: 'var(--z-nav)',
    navSticky: 'var(--z-nav-sticky)',
    overlay: 'var(--z-overlay)',
    spotlight: 'var(--z-spotlight)',
    critical: 'var(--z-critical)',
  },

  // Icon sizes
  iconSize: {
    xs: '0.75rem', // 12px
    sm: '1rem', // 16px
    base: '1.25rem', // 20px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '2.5rem', // 40px
  },

  // Focus states
  focus: {
    ring: 'var(--shadow-focus)',
    outline: '2px solid var(--accent)',
    outlineOffset: '2px',
  },
} as const;

// Utility functions for consistent styling
export const getSpacing = (size: keyof typeof designTokens.spacing) => designTokens.spacing[size];
export const getColor = (color: keyof typeof designTokens.colors) => designTokens.colors[color];
export const getBorderRadius = (size: keyof typeof designTokens.borderRadius) => designTokens.borderRadius[size];
export const getShadow = (size: keyof typeof designTokens.shadows) => designTokens.shadows[size];
export const getIconSize = (size: keyof typeof designTokens.iconSize) => designTokens.iconSize[size];

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Media query helpers
export const mediaQuery = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const;