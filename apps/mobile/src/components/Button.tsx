import { ActivityIndicator, Pressable, Text } from 'react-native'
import { colors } from '@/lib/theme'

interface Props {
  title: string
  onPress: () => void
  variant?: 'primary' | 'outline' | 'quiet'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  className,
}: Props) {
  const isPrimary = variant === 'primary'
  const surface = isPrimary
    ? 'bg-brand-600'
    : variant === 'outline'
      ? 'border border-paper-200 bg-paper'
      : 'bg-paper-100'
  const label = isPrimary ? 'text-paper' : variant === 'outline' ? 'text-ink-700' : 'text-ink-600'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      className={`h-12 flex-row items-center justify-center rounded-lg px-6 ${surface} ${
        disabled || loading ? 'opacity-50' : ''
      } ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? colors.paper : colors.brand} />
      ) : (
        <Text className={`font-semibold text-[14px] ${label}`}>{title}</Text>
      )}
    </Pressable>
  )
}
