import { useState } from 'react'
import { router } from 'expo-router'
import { ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { cartLines, cartTotals, formatINR } from '@steryle/core'
import { Button } from '@/components/Button'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { colors } from '@/lib/theme'
import { useCartStore } from '@/stores/cart-store'

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)
  const [orderId, setOrderId] = useState<string | null>(null)

  const lines = cartLines(items)
  const totals = cartTotals(lines)

  const placeOrder = () => {
    setOrderId(`STR-${Date.now().toString(36).toUpperCase()}`)
    clear()
  }

  if (orderId) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-paper">
        <ScreenHeader title="Order confirmed" />
        <View className="flex-1 items-center justify-center px-10">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-success-50">
            <Ionicons name="checkmark-circle" size={36} color={colors.success} />
          </View>
          <Text variant="title" className="mt-5">
            Thanks for your order
          </Text>
          <Text variant="body" className="mt-2 text-center text-ink-400">
            Reference {orderId}. A GST invoice has been emailed to you.
          </Text>
          <Text variant="meta" className="mt-3 text-center text-ink-400">
            Demo app — no payment was taken and nothing will ship.
          </Text>
          <Button
            title="Continue shopping"
            onPress={() => router.replace('/(tabs)')}
            className="mt-7"
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-paper">
      <ScreenHeader title="Checkout" showBack />

      <ScrollView contentContainerClassName="pb-14" keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-6">
          <Text variant="label">Delivery address</Text>
          <View className="mt-4 gap-3">
            <Field label="Full name" autoComplete="name" />
            <Field label="Phone" keyboardType="phone-pad" autoComplete="tel" />
            <Field label="Address" />
            <Field label="City" />
            <Field label="PIN code" keyboardType="number-pad" />
            <Field label="GSTIN (optional)" autoCapitalize="characters" />
          </View>
        </View>

        <View className="mt-8 px-5">
          <Text variant="label">Order summary</Text>
          <View className="mt-4 border-t border-paper-200 pt-3">
            {lines.map((line) => (
              <View key={line.sku} className="flex-row justify-between gap-4 py-1">
                <Text variant="body" numberOfLines={1} className="flex-1 text-ink-500">
                  {line.qty} × {line.name}
                </Text>
                <Text variant="body">{formatINR(line.price * line.qty)}</Text>
              </View>
            ))}
          </View>

          <View className="mt-3 flex-row items-baseline justify-between border-t border-paper-200 pt-3">
            <Text variant="body" className="text-ink-400">
              Total
            </Text>
            <Text className="font-semibold text-[20px] tracking-tight text-ink-900">
              {formatINR(totals.total)}
            </Text>
          </View>

          <Button
            title="Place order"
            onPress={placeOrder}
            disabled={lines.length === 0}
            className="mt-6 w-full"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label,
  ...rest
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text variant="meta">{label}</Text>
      <TextInput
        placeholderTextColor={colors.ink300}
        className="mt-1 h-12 rounded-lg border border-paper-200 px-3.5 font-sans text-[14px] text-ink-900"
        {...rest}
      />
    </View>
  )
}
