import { useState } from 'react'
import { getProductImage } from '../data/images'
import { CategoryIcon } from './Icons'

// Deterministic pastel gradient per product, used as a graceful fallback
// behind the photo (and shown if an image fails to load).
const PALETTES = [
  ['#eef7ff', '#bce0ff'],
  ['#ecfdf5', '#bbf7e0'],
  ['#fef3f2', '#fecdca'],
  ['#fffbeb', '#fde68a'],
  ['#f5f3ff', '#ddd6fe'],
  ['#f0f9ff', '#a5e8ff'],
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

export default function ProductImage({
  product,
  className = '',
  iconSize = 64,
  src,
  showSku = true,
}) {
  const [from, to] = PALETTES[hash(product.sku) % PALETTES.length]
  const imageUrl = src || getProductImage(product)
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {!failed && imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <CategoryIcon
          name={product.icon}
          width={iconSize}
          height={iconSize}
          className="text-slate-700/70"
        />
      )}
      {showSku && (
        <span className="absolute bottom-2 right-2 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 backdrop-blur">
          {product.sku}
        </span>
      )}
    </div>
  )
}
