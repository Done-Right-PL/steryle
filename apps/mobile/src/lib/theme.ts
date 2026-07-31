import tokens from '@steryle/config/tokens'

/**
 * Imperative mirror of tailwind.config.js, for the places that can't take
 * NativeWind classes: navigator options, StatusBar, ActivityIndicator, icons
 * and placeholderTextColor.
 */
export const colors = {
  brand: tokens.brand[600],
  brand50: tokens.brand[50],
  brand100: tokens.brand[100],
  brand500: tokens.brand[500],
  brand700: tokens.brand[700],
  accent: tokens.accent[600],
  accent50: tokens.accent[50],
  accent500: tokens.accent[500],
  ink: tokens.ink[900],
  ink800: tokens.ink[800],
  ink700: tokens.ink[700],
  ink600: tokens.ink[600],
  ink500: tokens.ink[500],
  ink400: tokens.ink[400],
  ink300: tokens.ink[300],
  paper: tokens.paper[0],
  paper50: tokens.paper[50],
  paper100: tokens.paper[100],
  paper200: tokens.paper[200],
  paper300: tokens.paper[300],
  success: tokens.success[600],
  success50: tokens.success[50],
  danger: tokens.danger[600],
  danger50: tokens.danger[50],
  danger100: tokens.danger[100],
  danger500: tokens.danger[500],
} as const

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const
