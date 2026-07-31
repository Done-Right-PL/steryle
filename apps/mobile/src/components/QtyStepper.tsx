import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/theme'

interface Props {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
}

export function QtyStepper({ value, onChange, min = 1, max = 99 }: Props) {
  return (
    <View className="h-11 flex-row items-center self-start rounded-lg border border-paper-200">
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        accessibilityLabel="Decrease quantity"
        className={`h-full w-10 items-center justify-center ${value <= min ? 'opacity-30' : ''}`}
      >
        <Ionicons name="remove" size={15} color={colors.ink500} />
      </Pressable>
      <Text className="w-9 text-center font-medium text-[13px] text-ink-900">{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        accessibilityLabel="Increase quantity"
        className={`h-full w-10 items-center justify-center ${value >= max ? 'opacity-30' : ''}`}
      >
        <Ionicons name="add" size={15} color={colors.ink500} />
      </Pressable>
    </View>
  )
}
