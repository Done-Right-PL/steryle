import { useState } from 'react'
import { Link, useLocalSearchParams } from 'expo-router'
import { Dimensions, FlatList, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { formatINR, getProductBySlug, getRelatedProducts } from '@stryle/core'
import { Button } from '@/components/Button'
import { ProductCard } from '@/components/ProductCard'
import { ProductPhoto } from '@/components/ProductPhoto'
import { QtyStepper } from '@/components/QtyStepper'
import { Rating } from '@/components/Rating'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { colors } from '@/lib/theme'
import { useCartStore } from '@/stores/cart-store'

const SCREEN_WIDTH = Dimensions.get('window').width

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const add = useCartStore((s) => s.add)

  const product = slug ? getProductBySlug(slug) : undefined

  if (!product) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-paper">
        <ScreenHeader title="Not found" showBack />
        <View className="px-5 pt-8">
          <Text variant="body" className="text-ink-400">
            That product doesn&apos;t exist.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const related = getRelatedProducts(product, 6)
  const specs: [string, string | number][] = [
    ['Brand', product.brand],
    ['Category', product.category],
    ['Variant', product.variant],
    ['Pack size', product.unit],
    ['SKU', product.sku],
    ['HSN code', product.hsn],
  ]

  const onAdd = () => {
    add(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper">
      <ScreenHeader title={product.brand} showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-14">
        {/* Square hero keeps the product photo dominant. */}
        {product.images.length > 1 ? (
          <FlatList
            horizontal
            pagingEnabled
            data={product.images}
            keyExtractor={(uri) => uri}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProductPhoto
                uri={item}
                padding={28}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              />
            )}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            style={{ height: SCREEN_WIDTH }}
          />
        ) : (
          <ProductPhoto
            uri={product.images[0]}
            padding={28}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
          />
        )}

        <View className="px-5 pt-6">
          <Text variant="label">{product.brand}</Text>
          <Text variant="title" className="mt-2 text-[19px] leading-[25px]">
            {product.name}
          </Text>

          <View className="mt-3 flex-row items-center gap-4">
            <Rating value={product.rating} reviews={product.reviews} size={12} />
            <Text variant="meta" className="text-ink-400">
              {product.sku}
            </Text>
          </View>

          <View className="mt-5 flex-row items-baseline gap-2.5 border-t border-paper-200 pt-5">
            <Text className="font-semibold text-[26px] tracking-tight text-ink-900">
              {formatINR(product.price)}
            </Text>
            {product.mrp > product.price && (
              <>
                <Text variant="body" className="text-ink-400 line-through">
                  {formatINR(product.mrp)}
                </Text>
                <View className="rounded-full bg-danger-100 px-2 py-0.5">
                  <Text variant="label" className="text-danger-700">
                    {product.discountPct}% off
                  </Text>
                </View>
              </>
            )}
          </View>
          <Text variant="meta" className="mt-1">
            Inclusive of all taxes · {product.unit}
          </Text>

          <View className="mt-4 flex-row items-center gap-2">
            <Ionicons
              name={product.inStock ? 'checkmark-circle' : 'time-outline'}
              size={15}
              color={product.inStock ? colors.success : colors.ink500}
            />
            <Text
              variant="body"
              className={product.inStock ? 'font-medium text-success' : 'text-ink-500'}
            >
              {product.inStock ? 'In stock — ships in 24–48 hours' : 'Currently restocking'}
            </Text>
          </View>

          <View className="mt-6 flex-row items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} />
            <Button
              title={added ? 'Added' : 'Add to cart'}
              onPress={onAdd}
              variant="primary"
              disabled={!product.inStock}
              className="flex-1"
            />
          </View>

          <View className="mt-8 border-t border-paper-200 pt-6">
            {product.highlights.map((h) => (
              <View key={h} className="mb-2 flex-row gap-2">
                <Ionicons name="checkmark" size={15} color={colors.success} />
                <Text variant="body" className="flex-1 text-ink-600">
                  {h}
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-6 border-t border-paper-200 pt-6">
            <Text variant="label">Description</Text>
            <Text variant="body" className="mt-3 text-ink-500">
              {product.description}
            </Text>
          </View>

          <View className="mt-6 border-t border-paper-200 pt-6">
            <Text variant="label">Specifications</Text>
            <View className="mt-2">
              {specs.map(([label, value]) => (
                <View
                  key={label}
                  className="flex-row justify-between border-b border-paper-200 py-2.5"
                >
                  <Text variant="body" className="text-ink-400">
                    {label}
                  </Text>
                  <Text variant="body" className="text-ink-900">
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {related.length > 0 && (
          <View className="mt-10">
            <View className="px-5">
              <Text variant="title">More in {product.category}</Text>
            </View>
            <FlatList
              horizontal
              data={related}
              keyExtractor={(item) => item.sku}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-4 px-5 pt-4"
              renderItem={({ item }) => <ProductCard product={item} width={156} />}
            />
          </View>
        )}

        <View className="mt-10 px-5">
          <Link href="/(tabs)/cart" asChild>
            <Pressable className="h-12 flex-row items-center justify-center border border-paper-200">
              <Text variant="body" className="text-ink-500">
                Go to cart
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
