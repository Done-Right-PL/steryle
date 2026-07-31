import { Text as RNText, type TextProps } from 'react-native'

type Variant = 'display' | 'title' | 'body' | 'meta' | 'label'

const VARIANTS: Record<Variant, string> = {
  display: 'font-semibold text-[28px] leading-[34px] tracking-tight text-ink-900',
  title: 'font-semibold text-[17px] leading-[22px] tracking-tight text-ink-900',
  body: 'font-sans text-[13px] leading-[19px] text-ink-700',
  meta: 'font-sans text-[11px] leading-[15px] text-ink-400',
  label: 'font-semibold text-[10px] leading-[13px] tracking-[1.2px] text-ink-400',
}

interface Props extends TextProps {
  variant?: Variant
  className?: string
  children: React.ReactNode
}

/** Single typographic scale, so screens never hand-roll font sizes. */
export function Text({ variant = 'body', className, children, ...rest }: Props) {
  const isLabel = variant === 'label'
  return (
    <RNText
      className={`${VARIANTS[variant]} ${className ?? ''}`}
      style={isLabel ? { textTransform: 'uppercase' } : undefined}
      {...rest}
    >
      {children}
    </RNText>
  )
}
