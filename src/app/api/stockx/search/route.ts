import { NextResponse } from 'next/server'
import { getStockXToken } from '@/lib/stockx'

const STOCKX_API_KEY = process.env.STOCKX_API_KEY || ''

const GOAT_ALGOLIA_APP = '2FWOTDVM2O'
const GOAT_ALGOLIA_KEY = 'ac96de6fef0e02bb95d433d8d5c7038a'

async function searchStockX(query: string, limit: number) {
  const token = await getStockXToken()
  if (!token || !STOCKX_API_KEY) return null

  const headers = {
    'x-api-key': STOCKX_API_KEY,
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  }

  const res = await fetch(
    `https://api.stockx.com/v2/catalog/search?query=${encodeURIComponent(query)}&pageSize=${limit}`,
    { headers }
  )
  if (!res.ok) return null
  const data = await res.json()
  return (data.products || []).map((p: any) => ({
    id: p.id,
    name: p.title || p.name,
    brand: p.brand,
    colorway: p.colorway,
    retailPrice: p.retailPrice,
    styleId: p.styleId,
    image: p.media?.imageUrl || p.media?.thumbUrl || '',
    thumb: p.media?.thumbUrl || p.media?.imageUrl || '',
    // Include all images if available
    imageUrls: [
      p.media?.imageUrl,
      p.media?.thumbUrl,
      ...(p.media?.gallery || []),
    ].filter(Boolean),
  }))
}

// Fetch product detail from StockX to get available sizes
async function getStockXProductDetail(productId: string) {
  const token = await getStockXToken()
  if (!token || !STOCKX_API_KEY) return null

  try {
    const res = await fetch(
      `https://api.stockx.com/v2/catalog/products/${productId}`,
      {
        headers: {
          'x-api-key': STOCKX_API_KEY,
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function searchGOAT(query: string, limit: number) {
  // Fetch with distinct: false to get ALL size variants, then group by product
  const res = await fetch(`https://${GOAT_ALGOLIA_APP}-dsn.algolia.net/1/indexes/product_variants_v2/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-algolia-application-id': GOAT_ALGOLIA_APP,
      'x-algolia-api-key': GOAT_ALGOLIA_KEY,
    },
    body: JSON.stringify({
      query,
      hitsPerPage: Math.min(limit * 10, 100),
      distinct: false,
      attributesToRetrieve: ['product_template_id', 'name', 'product_title', 'brand_name', 'color', 'retail_price_cents', 'sku', 'main_picture_url', 'picture_url', 'size', 'slug'],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()

  // Group variants by product_template_id to collect all sizes
  const grouped = new Map<string, { hit: any; sizes: Set<string> }>()
  for (const h of (data.hits || [])) {
    const pid = String(h.product_template_id || h.sku || h.name)
    if (!grouped.has(pid)) {
      grouped.set(pid, { hit: h, sizes: new Set() })
    }
    if (h.size) grouped.get(pid)!.sizes.add(String(h.size))
  }

  return Array.from(grouped.values())
    .slice(0, limit)
    .map(({ hit: h, sizes }) => ({
      id: h.product_template_id || h.id || '',
      name: h.name || h.product_title || '',
      brand: h.brand_name || '',
      colorway: h.color || '',
      retailPrice: h.retail_price_cents ? h.retail_price_cents / 100 : null,
      styleId: h.sku || '',
      image: h.main_picture_url || h.picture_url || '',
      thumb: h.main_picture_url || h.picture_url || '',
      availableSizes: Array.from(sizes).sort((a, b) => parseFloat(a) - parseFloat(b)),
    }))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) return NextResponse.json({ error: 'Query required', products: [] }, { status: 400 })

    // GOAT Algolia is primary (free, always works for name/style ID)
    let products = await searchGOAT(query, limit)

    // Try StockX as fallback if GOAT found nothing and we have a valid token
    if (!products || products.length === 0) {
      try {
        products = await searchStockX(query, limit)
      } catch {
        // StockX auth may not be configured
      }
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json({ error: 'Search failed', products: [] }, { status: 500 })
  }
}
