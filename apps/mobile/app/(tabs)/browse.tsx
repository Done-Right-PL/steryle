import { Link } from 'expo-router'
import { FlatList, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { categories, products } from '@steryle/core'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { colors } from '@/lib/theme'

export default function BrowseScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper">
      <ScreenHeader
        title="Browse"
        subtitle={`${products.length.toLocaleString('en-IN')} products · ${categories.length} categories`}
      />
      <FlatList
        data={categories}
        keyExtractor={(item) => item.slug}
        ItemSeparatorComponent={() => <View className="h-px bg-paper-200" />}
        contentContainerClassName="pb-14"
        renderItem={({ item }) => (
          <Link href={`/category/${item.slug}`} asChild>
            <Pressable className="flex-row items-center gap-4 px-5 py-4">
              <View className="flex-1">
                <Text variant="body" className="font-medium text-ink-900">
                  {item.name}
                </Text>
                <Text variant="meta" className="mt-1" numberOfLines={1}>
                  {item.productCount} items
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.ink300} />
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  )
}
