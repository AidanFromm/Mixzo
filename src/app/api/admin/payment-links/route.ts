import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'
import { getStripe } from '@/lib/stripe'
import { SITE_URL, SITE_NAME } from '@/lib/constants'

export async function GET(request: Request) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin.from('payment_links').select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ payment_links: data })
  } catch (error: any) {
    console.error('Payment links GET error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, amount, customer_name, customer_email, note } = body

    if (!title || !amount || amount < 1) {
      return NextResponse.json({ error: 'Title and amount ($1+) required' }, { status: 400 })
    }

    const stripe = getStripe()

    // Create a Stripe Payment Link via Checkout Session URL
    // First create a one-time price
    const product = await stripe.products.create({
      name: title,
      metadata: {
        source: 'payment_link',
        customer_name: customer_name || '',
        note: note || '',
      },
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency: 'usd',
    })

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        source: 'mixzokickz_payment_link',
        customer_name: customer_name || '',
        customer_email: customer_email || '',
        note: note || '',
      },
      after_completion: {
        type: 'redirect',
        redirect: { url: `${SITE_URL}/checkout/confirmation?source=payment_link` },
      },
      ...(customer_email ? { custom_fields: [] } : {}),
    })

    // Save to Supabase
    const { data, error } = await supabaseAdmin.from('payment_links').insert({
      title,
      amount,
      url: paymentLink.url,
      stripe_payment_link_id: paymentLink.id,
      stripe_product_id: product.id,
      customer_name: customer_name || null,
      customer_email: customer_email || null,
      note: note || null,
      status: 'active',
      views: 0,
      created_by: user.id,
    }).select().single()

    if (error) {
      console.error('Supabase insert error:', error)
      // Still return the link even if DB save fails
      return NextResponse.json({
        payment_link: {
          id: paymentLink.id,
          title,
          amount,
          url: paymentLink.url,
          status: 'active',
          created_at: new Date().toISOString(),
        }
      }, { status: 201 })
    }

    return NextResponse.json({ payment_link: data }, { status: 201 })
  } catch (error: any) {
    console.error('Payment links POST error:', error?.type, error?.message, error?.statusCode)
    const msg = error?.message || 'Server error'
    return NextResponse.json({ error: msg, type: error?.type || 'unknown' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Payment link ID required' }, { status: 400 })

    // Deactivate on Stripe if we have the ID
    const { data: link } = await supabaseAdmin.from('payment_links').select('stripe_payment_link_id').eq('id', id).single()
    if (link?.stripe_payment_link_id) {
      try {
        const stripe = getStripe()
        await stripe.paymentLinks.update(link.stripe_payment_link_id, { active: false })
      } catch (e) {
        console.error('Failed to deactivate Stripe link:', e)
      }
    }

    const { error } = await supabaseAdmin.from('payment_links').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment links DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
