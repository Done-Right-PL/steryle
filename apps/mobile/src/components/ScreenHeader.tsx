import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/theme'
import { Text } from './Text'

interface Props {
  title: string
  subtitle?: string
  showBack?: boolean
  right?: React.ReactNode
}

export function ScreenHeader({ title, subtitle, showBack, right }: Props) {
  return (
    <View className="border-b border-paper-200 bg-paper px-5 pb-4">
      <View className="flex-row items-center gap-3">
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            hitSlop={10}
            className="-ml-1.5 p-1.5"
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
        )}
        <View className="flex-1">
          <Text variant="title" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="meta" className="mt-0.5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  )
}
