import { Link, router } from 'expo-router'
import { FlatList, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { cartLines, cartTotals, formatINR, FREE_SHIPPING_THRESHOLD } from '@stryle/core'
import { Button } from '@/components/Button'
import { ProductPhoto } from '@/components/ProductPhoto'
import { QtyStepper } from '@/components/QtyStepper'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { colors } from '@/lib/theme'
import { useCartStore } from '@/stores/cart-store'

export default function CartScreen() {
  const items = useCartStore((s) => s.items)
  const hydrated = useCartStore((s) => s.hydrated)
  const setQty = useCartStore((s) => s.setQty)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)

  const lines = cartLines(items)
  const totals = cartTotals(lines)
  const toFreeShipping = FREE_SHIPPING_THRESHOLD - totals.subtotal

  if (!hydrated) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-paper">
        <ScreenHeader title="Cart" />
      </SafeAreaView>
    )
  }

  if (lines.length === 0) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-paper">
        <ScreenHeader title="Cart" />
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="bag-outline" size={30} color={colors.ink300} />
          <Text variant="title" className="mt-5">
            Your cart is empty
          </Text>
          <Text variant="body" className="mt-2 text-center text-ink-400">
            Browse the catalogue and add the supplies you need.
          </Text>
          <Link href="/(tabs)/browse" asChild>
            <Pressable className="mt-7 h-12 items-center justify-center rounded-lg bg-brand-600 px-6">
              <Text className="font-medium text-[13px] text-paper">Browse catalogue</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper">
      <ScreenHeader
        title="Cart"
        subtitle={`${lines.length} ${lines.length === 1 ? 'item' : 'items'}`}
        right={
          <Pressable onPress={clear} hitSlop={8}>
            <Text variant="meta" className="text-ink-400">
              Clear
            </Text>
          </Pressable>
        }
      />

      <FlatList
        data={lines}
        keyExtractor={(item) => item.sku}
        ItemSeparatorComponent={() => <View className="h-px bg-paper-200" />}
        contentContainerClassName="pb-4"
        renderItem={({ item }) => (
          <View className="flex-row gap-4 px-5 py-4">
            <Link href={`/product/${item.slug}`} asChild>
              <Pressable>
                <ProductPhoto uri={item.image} className="h-24 w-24" padding={8} />
              </Pressable>
            </Link>

            <View className="flex-1">
              <Text variant="label" numberOfLines={1}>
                {item.brand}
              </Text>
              <Text variant="body" numberOfLines={2} className="mt-1">
                {item.name}
              </Text>
              <View className="mt-2.5 flex-row items-center gap-3">
                <QtyStepper value={item.qty} onChange={(q) => setQty(item.sku, q)} />
                <Pressable onPress={() => remove(item.sku)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={15} color={colors.ink400} />
                </Pressable>
              </View>
            </View>

            <Text className="font-semibold text-[14px] text-ink-900">
              {formatINR(item.price * item.qty)}
            </Text>
          </View>
        )}
      />

      <View className="border-t border-paper-200 px-5 pb-2 pt-4">
        <Row label="Subtotal" value={formatINR(totals.subtotal)} />
        <Row
          label="Shipping"
          value={totals.shipping === 0 ? 'Free' : formatINR(totals.shipping)}
        />
        <Row label="GST (12%)" value={formatINR(totals.tax)} />

        <View className="mt-3 flex-row items-baseline justify-between border-t border-paper-200 pt-3">
          <Text variant="body" className="text-ink-400">
            Total
          </Text>
          <Text className="font-semibold text-[20px] tracking-tight text-ink-900">
            {formatINR(totals.total)}
          </Text>
        </View>

        {toFreeShipping > 0 && (
          <Text variant="meta" className="mt-2">
            Add {formatINR(toFreeShipping)} more for free delivery.
          </Text>
        )}

        <Button
          title="Checkout"
          onPress={() => router.push('/checkout')}
          className="mt-4 w-full"
        />
      </View>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text variant="body" className="text-ink-400">
        {label}
      </Text>
      <Text variant="body" className="text-ink-900">
        {value}
      </Text>
    </View>
  )
}
