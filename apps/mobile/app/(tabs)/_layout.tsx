import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts } from '@/lib/theme'
import { useCartCount } from '@/stores/cart-store'

export default function TabsLayout() {
  const count = useCartCount()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.ink400,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.paper200,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.2 },
        tabBarBadgeStyle: {
          backgroundColor: colors.danger,
          color: colors.paper,
          fontSize: 10,
          fontFamily: fonts.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: count > 0 ? count : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
