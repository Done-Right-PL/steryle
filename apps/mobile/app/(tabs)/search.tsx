import { useMemo, useState } from 'react'
import { FlatList, Pressable, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { searchProducts, topBrands } from '@stryle/core'
import { ProductCard } from '@/components/ProductCard'
import { Text } from '@/components/Text'
import { colors } from '@/lib/theme'

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => (query.trim() ? searchProducts(query, 60) : []), [query])
  const trimmed = query.trim()

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper">
      <View className="border-b border-paper-200 px-5 pb-4">
        <View className="h-11 flex-row items-center gap-2.5 rounded-lg border border-paper-200 bg-paper-50 px-3">
          <Ionicons name="search" size={16} color={colors.ink400} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search products, brands or SKUs"
            placeholderTextColor={colors.ink400}
            autoCorrect={false}
            returnKeyType="search"
            className="flex-1 font-sans text-[14px] text-ink-900"
          />
          {trimmed.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close" size={16} color={colors.ink400} />
            </Pressable>
          )}
        </View>
      </View>

      {trimmed.length === 0 ? (
        <View className="px-5 pt-8">
          <Text variant="label">Popular brands</Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {topBrands.map((brand) => (
              <Pressable
                key={brand}
                onPress={() => setQuery(brand)}
                className="border border-paper-200 px-3 py-2"
              >
                <Text variant="body" className="text-ink-500">
                  {brand}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : results.length === 0 ? (
        <View className="px-5 pt-12">
          <Text variant="body" className="text-ink-400">
            Nothing matched “{trimmed}”. Try a brand name or a broader term.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.sku}
          numColumns={2}
          columnWrapperClassName="gap-4 px-5"
          contentContainerClassName="gap-8 pb-14 pt-5"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View className="px-5 pb-1">
              <Text variant="meta">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </SafeAreaView>
  )
}
