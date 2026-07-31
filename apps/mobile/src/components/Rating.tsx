import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/theme'
import { Text } from './Text'

interface Props {
  value: number
  reviews: number
  size?: number
}

export function Rating({ value, reviews, size = 12 }: Props) {
  if (!reviews) {
    return (
      <Text variant="meta" className="text-ink-400">
        No reviews yet
      </Text>
    )
  }

  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="star" size={size} color={colors.success} />
      <Text variant="meta" className="font-semibold text-ink-800">
        {value.toFixed(1)}
      </Text>
      <Text variant="meta">({reviews})</Text>
    </View>
  )
}
