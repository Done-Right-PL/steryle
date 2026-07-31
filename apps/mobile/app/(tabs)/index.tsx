import { Link } from 'expo-router'
import { FlatList, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { bestSellers, categories, featuredProducts, products, topBrands } from '@steryle/core'
import { ProductCard } from '@/components/ProductCard'
import { Text } from '@/components/Text'
import { colors } from '@/lib/theme'

const CARD_WIDTH = 156

export default function ShopScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-14">
        <View className="flex-row items-center gap-2 px-5 pb-5 pt-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <Ionicons name="add" size={20} color={colors.paper} />
          </View>
          <Text className="font-semibold text-[20px] tracking-tight text-ink-900">
            Ster<Text className="text-brand-600">yle</Text>
          </Text>
        </View>

        <View className="bg-brand-50/60 px-5 pb-7 pt-6">
          <View className="self-start rounded-full bg-brand-100 px-2.5 py-1">
            <Text variant="meta" className="font-semibold text-brand-700">
              India&apos;s surgical supply store
            </Text>
          </View>
          <Text variant="display" className="mt-3 text-[30px] leading-[36px]">
            Everything your clinic needs,{' '}
            <Text className="font-semibold text-[30px] leading-[36px] text-brand-600">in one</Text>{' '}
            <Text className="font-semibold text-[30px] leading-[36px] text-accent-600">place.</Text>
          </Text>
          <Text variant="body" className="mt-3 text-ink-500">
            {products.length.toLocaleString('en-IN')} genuine products from {topBrands.length}+
            trusted brands, delivered across India.
          </Text>

          <Link href="/(tabs)/browse" asChild>
            <Pressable className="mt-6 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brand-600 px-6">
              <Text className="font-semibold text-[14px] text-paper">Shop all categories</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.paper} />
            </Pressable>
          </Link>
        </View>

        <Rail title="Best value today" data={featuredProducts} />

        <View className="mt-11 px-5">
          <Text variant="title">Categories</Text>
        </View>
        <View className="mt-4 flex-row flex-wrap gap-3 px-5">
          {categories.slice(0, 8).map((c, i) => (
            <Link key={c.slug} href={`/category/${c.slug}`} asChild>
              <Pressable className="min-w-[47%] flex-1 rounded-xl border border-paper-200 bg-paper p-4">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    i % 2 ? 'bg-accent-50' : 'bg-brand-50'
                  }`}
                >
                  <Ionicons
                    name="medkit-outline"
                    size={20}
                    color={i % 2 ? colors.accent : colors.brand}
                  />
                </View>
                <Text variant="body" numberOfLines={2} className="mt-3 font-semibold text-ink-800">
                  {c.name}
                </Text>
                <Text variant="meta" className="mt-1 text-ink-400">
                  {c.productCount} items
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <Rail title="Most reviewed" data={bestSellers} />
      </ScrollView>
    </SafeAreaView>
  )
}

function Rail({ title, data }: { title: string; data: typeof products }) {
  return (
    <View className="mt-11">
      <View className="px-5">
        <Text variant="title">{title}</Text>
      </View>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.sku}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-4 px-5 pt-4"
        renderItem={({ item }) => <ProductCard product={item} width={CARD_WIDTH} />}
      />
    </View>
  )
}
