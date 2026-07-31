'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@steryle/core'
import { CategoryIcon } from './Icons'
import { iconForCategory } from '@/lib/category-icons'

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0)
  const images = product.images

  if (images.length === 0) {
    return (
      <div className="photo-plate grid aspect-square w-full place-items-center">
        <CategoryIcon
          name={iconForCategory(product.categorySlug)}
          width={64}
          height={64}
          className="text-ink-300"
        />
      </div>
    )
  }

  const current = images[active] ?? images[0]!

  return (
    <div className="lg:sticky lg:top-40 lg:self-start">
      <div className="photo-plate aspect-square w-full">
        <Image
          src={current}
          alt={product.name}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-contain p-10 mix-blend-multiply"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`photo-plate h-20 w-20 border-2 transition-colors ${
                i === active ? 'border-brand-600' : 'border-paper-200 hover:border-brand-300'
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-2 mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
