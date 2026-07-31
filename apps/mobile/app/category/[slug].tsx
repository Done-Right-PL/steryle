import { useMemo, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { FlatList, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  getBrandsForCategory,
  getCategoryBySlug,
  getProductsByCategory,
  sortProducts,
  type SortKey,
} from '@stryle/core'
import { ProductCard } from '@/components/ProductCard'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Featured' },
  { key: 'price-asc', label: 'Price ↑' },
  { key: 'price-desc', label: 'Price ↓' },
  { key: 'rating', label: 'Top rated' },
  { key: 'discount', label: 'Saving' },
]

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [sort, setSort] = useState<SortKey>('relevance')
  const [brand, setBrand] = useState<string | null>(null)

  const category = getCategoryBySlug(slug)
  const brands = useMemo(() => (slug ? getBrandsForCategory(slug) : []), [slug])

  const visible = useMemo(() => {
    if (!slug) return []
    const items = getProductsByCategory(slug).filter((p) => !brand || p.brand === brand)
    return sortProducts(items, sort)
  }, [slug, brand, sort])

  if (!category) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-paper">
        <ScreenHeader title="Not found" showBack />
        <View className="px-5 pt-8">
          <Text variant="body" className="text-ink-400">
            That category doesn&apos;t exist.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper">
      <ScreenHeader
        title={category.name}
        subtitle={`${visible.length} of ${category.productCount} products`}
        showBack
      />

      <View className="border-b border-paper-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 py-3"
        >
          {SORTS.map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              active={sort === s.key}
              onPress={() => setSort(s.key)}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 pb-3"
        >
          <Chip label="All brands" active={brand === null} onPress={() => setBrand(null)} />
          {brands.map((b) => (
            <Chip
              key={b}
              label={b}
              active={brand === b}
              onPress={() => setBrand(brand === b ? null : b)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.sku}
        numColumns={2}
        columnWrapperClassName="gap-4 px-5"
        contentContainerClassName="gap-8 pb-14 pt-5"
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={
          <View className="px-5 pt-10">
            <Text variant="body" className="text-ink-400">
              No products match these filters.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active ? 'border-brand-600 bg-brand-600' : 'border-paper-200 bg-paper'
      }`}
    >
      <Text variant="meta" className={active ? 'text-paper' : 'text-ink-600'}>
        {label}
      </Text>
    </Pressable>
  )
}
