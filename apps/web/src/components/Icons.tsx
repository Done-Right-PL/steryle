import type { SVGProps } from 'react'
import type { CategoryIconName } from '@stryle/core'

type IconProps = SVGProps<SVGSVGElement>

const base: IconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
}

const Svg = ({ d, ...p }: IconProps & { d: string }) => (
  <svg {...base} {...p} aria-hidden="true">
    {d.split('|').map((path) => (
      <path key={path} d={path} />
    ))}
  </svg>
)

export const Icon = {
  search: (p: IconProps) => <Svg d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z|m16 16 5 5" {...p} />,
  cart: (p: IconProps) => (
    <Svg d="M3 4h2.2l2.2 11.2A2 2 0 0 0 9.6 17H18a2 2 0 0 0 2-1.6L21 8H6|M9.5 21a1 1 0 1 0 0-.1|M17.5 21a1 1 0 1 0 0-.1" {...p} />
  ),
  user: (p: IconProps) => <Svg d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z|M4 21a8 8 0 0 1 16 0" {...p} />,
  menu: (p: IconProps) => <Svg d="M3 6h18|M3 12h18|M3 18h18" {...p} />,
  close: (p: IconProps) => <Svg d="M6 6l12 12|M18 6L6 18" {...p} />,
  star: (p: IconProps) => <Svg d="M12 4l2.3 4.9 5.2.7-3.8 3.7 1 5.3L12 16l-4.7 2.6 1-5.3L4.5 9.6l5.2-.7L12 4Z" {...p} />,
  arrow: (p: IconProps) => <Svg d="M4 12h15|M13 6l6 6-6 6" {...p} />,
  chevron: (p: IconProps) => <Svg d="M9 6l6 6-6 6" {...p} />,
  minus: (p: IconProps) => <Svg d="M5 12h14" {...p} />,
  plus: (p: IconProps) => <Svg d="M12 5v14|M5 12h14" {...p} />,
  trash: (p: IconProps) => <Svg d="M4 7h16|M9 7V4h6v3|M6 7l1 13h10l1-13" {...p} />,
  check: (p: IconProps) => <Svg d="M5 13l4 4L19 7" {...p} />,
  truck: (p: IconProps) => (
    <Svg d="M2 7h11v9H2zM13 11h4l3 3v2h-7z|M7 19a1.6 1.6 0 1 0 0-.1|M17 19a1.6 1.6 0 1 0 0-.1" {...p} />
  ),
  shield: (p: IconProps) => <Svg d="M12 3l8 3v6c0 4.4-3.2 7.9-8 9-4.8-1.1-8-4.6-8-9V6z|M9 12l2.2 2.2L15.5 10" {...p} />,
  invoice: (p: IconProps) => <Svg d="M6 3h9l3 3v15H6z|M9 9h7|M9 13h7|M9 17h4" {...p} />,
  phone: (p: IconProps) => <Svg d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.2A2 2 0 0 1 5 3Z" {...p} />,
  mail: (p: IconProps) => <Svg d="M3 6h18v12H3z|M3 7l9 6 9-6" {...p} />,
  pin: (p: IconProps) => <Svg d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" {...p} />,
  tag: (p: IconProps) => (
    <Svg d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z|M7.5 7.5a.6.6 0 1 0 0-.1" {...p} />
  ),
  headset: (p: IconProps) => (
    <Svg d="M4 13v-1a8 8 0 0 1 16 0v1|M4 13h3v6H5a1 1 0 0 1-1-1z|M20 13h-3v6h2a1 1 0 0 0 1-1z|M17 19a3 3 0 0 1-3 3h-2" {...p} />
  ),
}

const CAT_GLYPHS: Record<CategoryIconName, string> = {
  scalpel: 'M4 20 18 6l2 2L6 22z|M16 4l4 4',
  suture: 'M4 12c4-6 12-6 16 0|M4 12c4 6 12 6 16 0|M7 9v6|M12 7v10|M17 9v6',
  glove: 'M7 21V10l2-1V5a1.5 1.5 0 0 1 3 0v3a1.5 1.5 0 0 1 3 0v2a1.5 1.5 0 0 1 3 0v6a4 4 0 0 1-4 4z',
  syringe: 'm3 21 4-4|M9 11l4 4|M14 6l4 4-9 9-4-4z|M16 4l4 4',
  dressing: 'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z|M9 12h6|M12 9v6',
  mask: 'M3 9l4-1 5 1 5-1 4 1v3a9 9 0 0 1-18 0z|M3 11h18',
  stethoscope: 'M5 4v5a4 4 0 0 0 8 0V4|M9 17a5 5 0 0 0 10 0v-3|M19 14a1.6 1.6 0 1 0 0-.1',
  iv: 'M10 3h4v5l3 3v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6l3-3z|M7 13h10',
  brace: 'M5 8a7 7 0 0 1 14 0|M5 8v8a7 7 0 0 0 14 0V8|M5 12h14',
  spray: 'M9 8h6v12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z|M9 8V5h6v3|M17 4h2|M18 6V2',
  bed: 'M3 8v11|M3 13h18v6|M21 13v6|M7 13v-3h7a4 4 0 0 1 4 3',
  flask: 'M9 3h6|M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3|M7 16h10',
}

export const CategoryIcon = ({ name, ...p }: IconProps & { name: CategoryIconName }) => (
  <Svg d={CAT_GLYPHS[name] ?? CAT_GLYPHS.dressing} {...p} />
)
