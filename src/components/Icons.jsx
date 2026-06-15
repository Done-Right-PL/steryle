// Original line-icon set used across the store (no third-party assets).
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const Icon = {
  search: (p) => (
    <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
  ),
  cart: (p) => (
    <svg {...base} {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2.2l2 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" /></svg>
  ),
  user: (p) => (
    <svg {...base} {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
  ),
  menu: (p) => (
    <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  ),
  close: (p) => (
    <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
  ),
  star: (p) => (
    <svg viewBox="0 0 24 24" width={16} height={16} {...p}><path fill="currentColor" d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" /></svg>
  ),
  truck: (p) => (
    <svg {...base} {...p}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>
  ),
  shield: (p) => (
    <svg {...base} {...p}><path d="M12 3l7 3v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>
  ),
  headset: (p) => (
    <svg {...base} {...p}><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="3.5" height="6" rx="1.2" /><rect x="17.5" y="13" width="3.5" height="6" rx="1.2" /><path d="M20 19a4 4 0 0 1-4 3h-2" /></svg>
  ),
  tag: (p) => (
    <svg {...base} {...p}><path d="M3 12V4h8l9 9-7 7z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>
  ),
  check: (p) => (
    <svg {...base} {...p}><path d="m4 12 5 5L20 6" /></svg>
  ),
  trash: (p) => (
    <svg {...base} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
  ),
  plus: (p) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>),
  minus: (p) => (<svg {...base} {...p}><path d="M5 12h14" /></svg>),
  arrow: (p) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
  phone: (p) => (
    <svg {...base} {...p}><path d="M5 4h3l1.5 5-2 1.2a12 12 0 0 0 5.3 5.3l1.2-2L19 19v3a16 16 0 0 1-14-14z" /></svg>
  ),
  mail: (p) => (
    <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
  ),
  pin: (p) => (
    <svg {...base} {...p}><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></svg>
  ),
}

const CAT_GLYPHS = {
  scalpel: 'M4 20 18 6l2 2L6 22zM16 4l4 4',
  suture: 'M4 12c4-6 12-6 16 0M4 12c4 6 12 6 16 0M7 9v6M12 7v10M17 9v6',
  glove: 'M7 21V10l2-1V5a1.5 1.5 0 0 1 3 0v3a1.5 1.5 0 0 1 3 0v2a1.5 1.5 0 0 1 3 0v6a4 4 0 0 1-4 4z',
  syringe: 'm3 21 4-4M9 11l4 4M14 6l4 4-9 9-4-4zM16 4l4 4',
  dressing: 'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM9 12h6M12 9v6',
  mask: 'M3 9l4-1 5 1 5-1 4 1v3a9 9 0 0 1-18 0zM3 11h18',
  stethoscope: 'M5 4v5a4 4 0 0 0 8 0V4M9 17a5 5 0 0 0 10 0v-3M19 14a1.6 1.6 0 1 0 0-.1',
  iv: 'M10 3h4v5l3 3v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6l3-3zM7 13h10',
  brace: 'M5 8a7 7 0 0 1 14 0M5 8v8a7 7 0 0 0 14 0V8M5 12h14',
  spray: 'M9 8h6v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM9 8V5h6v3M17 4h2M18 6V2',
  bed: 'M3 8v11M3 13h18v6M21 13v6M7 13v-3h7a4 4 0 0 1 4 3',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 16h10',
}

export const CategoryIcon = ({ name, ...p }) => (
  <svg {...base} {...p}>
    <path d={CAT_GLYPHS[name] || CAT_GLYPHS.dressing} />
  </svg>
)
