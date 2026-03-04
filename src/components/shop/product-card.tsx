'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ConditionBadge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    brand: string
    price: number
    size: string
    condition: string
    image_url: string | null
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    cardRef.current.style.setProperty('--mouse-x', `${x}%`)
    cardRef.current.style.setProperty('--mouse-y', `${y}%`)
  }

  return (
    <Link href={`/product/${product.id}`} aria-label={`${product.name} - ${formatPrice(product.price)}`}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="spotlight-card group rounded-2xl bg-[#141418] border border-[#1E1E26] overflow-hidden transition-all duration-500 hover:translate-y-[-6px] hover:shadow-[0_20px_60px_rgba(255,46,136,0.08)] hover:border-[#FF2E88]/20"
      >
        <div className="aspect-square relative bg-[#1A1A22] overflow-hidden">
          {product.image_url ? (
            <>
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain p-6 transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-[-2deg] mix-blend-multiply dark:mix-blend-normal"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))' }}
              />
              {/* Vignette to blend white-bg images */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_10px_rgba(26,26,34,0.7)]" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[#6A6A80] text-sm">No Image</span>
            </div>
          )}
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {/* Condition badge */}
          <div className="absolute top-3 right-3 transition-transform duration-300 group-hover:scale-105">
            <ConditionBadge condition={product.condition} />
          </div>
          {/* Quick view hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="text-[10px] font-medium text-white/70 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
              View Details
            </span>
          </div>
        </div>
        <div className="p-3.5 relative z-10">
          <p className="text-[10px] font-semibold text-[#6A6A80] uppercase tracking-[0.15em]">{product.brand}</p>
          <h3 className="text-sm font-semibold text-[#F4F4F4] mt-1 line-clamp-2 leading-snug group-hover:text-[#FF2E88] transition-colors duration-300">{product.name}</h3>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1E1E26]/60">
            <span className="text-base font-black text-white tracking-tight">
              {formatPrice(product.price)}
            </span>
            <span className="text-[11px] text-[#6A6A80] font-medium bg-[#1A1A22] px-2 py-0.5 rounded-md">
              Size {product.size}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
