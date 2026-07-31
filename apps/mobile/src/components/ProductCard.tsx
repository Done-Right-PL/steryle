import { Link } from 'expo-router'
import { Pressable, View } from 'react-native'
import { formatINR, type Product } from '@stryle/core'
import { ProductPhoto } from './ProductPhoto'
import { Rating } from './Rating'
import { Text } from './Text'

interface Props {
  product: Product
  /** Grid cards stretch to the column; rail cards use a fixed width. */
  width?: number
}

export function ProductCard({ product, width }: Props) {
  return (
    <Link href={`/product/${product.slug}`} asChild>
      <Pressable
        style={width ? { width } : undefined}
        className={`overflow-hidden rounded-xl border border-paper-200 bg-paper ${
          width ? '' : 'flex-1'
        }`}
      >
        <View className="relative">
          <ProductPhoto uri={product.images[0]} className="aspect-square w-full" />
          {product.discountPct > 0 && (
            <View className="absolute left-2 top-2 rounded-full bg-danger-500 px-2 py-0.5">
              <Text variant="label" className="text-paper">
                {product.discountPct}% off
              </Text>
            </View>
          )}
          {!product.inStock && (
            <View className="absolute inset-0 items-center justify-center bg-paper/70">
              <Text variant="label" className="text-ink-700">
                Out of stock
              </Text>
            </View>
          )}
        </View>

        <View className="p-3">
          <Text variant="label" numberOfLines={1} className="text-brand-600">
            {product.brand}
          </Text>
          <Text variant="body" numberOfLines={2} className="mt-1 font-semibold text-ink-800">
            {product.name}
          </Text>
          <View className="mt-1.5">
            <Rating value={product.rating} reviews={product.reviews} />
          </View>
          <View className="mt-1.5 flex-row items-baseline gap-2">
            <Text className="font-semibold text-[15px] text-ink-900">
              {formatINR(product.price)}
            </Text>
            {product.mrp > product.price && (
              <Text variant="meta" className="text-ink-400 line-through">
                {formatINR(product.mrp)}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  )
}
