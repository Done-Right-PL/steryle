import Constants from 'expo-constants'
import { Image } from 'expo-image'
import { View, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/theme'

/**
 * Catalogue photography that ships with the repo is stored under the web app's
 * `public/` directory, so the shared catalogue records it as a root-relative
 * path. React Native has no origin to resolve those against — resolve them
 * against the same host the rest of the app talks to.
 */
const ASSET_ORIGIN = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? ''

function resolveUri(uri?: string): string | undefined {
  if (!uri) return undefined
  return uri.startsWith('/') ? `${ASSET_ORIGIN}${uri}` : uri
}

interface Props {
  uri?: string
  /** Extra classes for the neutral plate the photo sits on. */
  className?: string
  /** For dimensions that can only be known at runtime (e.g. screen width). */
  style?: ViewStyle
  padding?: number
}

/**
 * Product photography is the only colour in the app, so it always sits on a
 * neutral plate and is contained rather than cropped.
 */
export function ProductPhoto({ uri, className, style, padding = 16 }: Props) {
  const source = resolveUri(uri)

  return (
    <View
      style={style}
      className={`items-center justify-center overflow-hidden bg-paper-50 ${className ?? ''}`}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: '100%', height: '100%', padding }}
          contentFit="contain"
          transition={180}
        />
      ) : (
        <Ionicons name="cube-outline" size={28} color={colors.ink300} />
      )}
    </View>
  )
}
