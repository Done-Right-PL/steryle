/**
 * Steryle design tokens — the blue marketplace system shared by web and mobile.
 *
 * Brand blue carries primary actions and wayfinding, teal marks secondary
 * emphasis, and the neutral scale is cool-tinted so it sits with the blues
 * rather than fighting them. Both apps read this file, so a change here lands
 * on the storefront and the app at once.
 */

/** Primary blue — buttons, links, active nav, brand marks. */
const brand = {
  50: '#eef7ff',
  100: '#d9edff',
  200: '#bce0ff',
  300: '#8eccff',
  400: '#59aeff',
  500: '#338bff',
  600: '#1f6cf5',
  700: '#1a56e1',
  800: '#1c47b6',
  900: '#1d408f',
  950: '#162857',
}

/** Teal — secondary emphasis, gradient tail, hover accents. */
const accent = {
  50: '#effcfb',
  100: '#c9f5f2',
  500: '#0ea5a4',
  600: '#0d9090',
  700: '#0b7676',
}

/** Cool neutral scale for text and surfaces. */
const ink = {
  /** Headings and primary text. */
  900: '#0f172a',
  /** Body copy. */
  800: '#1e293b',
  700: '#334155',
  /** Secondary copy. */
  600: '#475569',
  500: '#64748b',
  /** Muted labels and metadata. */
  400: '#94a3b8',
  /** Faint captions, placeholders, disabled text. */
  300: '#cbd5e1',
}

const paper = {
  /** Page canvas. */
  0: '#ffffff',
  /** Alternating sections, image plates. */
  50: '#f8fafc',
  /** Inset surfaces, hover states. */
  100: '#f1f5f9',
  /** Hairline rules and input borders. */
  200: '#e2e8f0',
  /** Stronger dividers. */
  300: '#cbd5e1',
}

/** In-stock confirmations, ratings, highlight ticks. */
const success = {
  50: '#f0fdf4',
  100: '#dcfce7',
  600: '#16a34a',
  700: '#15803d',
}

/** Discount badges, cart count and destructive actions. */
const danger = {
  50: '#fff1f2',
  100: '#ffe4e6',
  500: '#f43f5e',
  600: '#e11d48',
  700: '#be123c',
}

const tokens = {
  brand,
  accent,
  ink,
  paper,
  success,
  danger,
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
    xxl: 64,
  },
  shadow: {
    card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    hover: '0 10px 30px rgba(31,108,245,0.12)',
  },
  font: {
    sans: 'Inter',
    /** Micro-labels: uppercase, wide tracking, small size. */
    label: { size: 11, tracking: 1.2, weight: '600' },
  },
}

module.exports = tokens
module.exports.brand = brand
module.exports.accent = accent
module.exports.ink = ink
module.exports.paper = paper
module.exports.success = success
module.exports.danger = danger
