import { Resend } from 'resend'
import { SITE_NAME, SITE_URL, BUSINESS_EMAIL, BUSINESS_PHONE, BUSINESS_LOCATION } from '@/lib/constants'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || `${SITE_NAME} <onboarding@resend.dev>`

// Brand colors
const PINK = '#FF2E88'
const CYAN = '#00C2D6'
const BG_DARK = '#0C0C0C'
const BG_CARD = '#141418'
const BG_ELEVATED = '#1A1A22'
const TEXT_PRIMARY = '#F4F4F4'
const TEXT_SECONDARY = '#A0A0B8'
const TEXT_MUTED = '#6A6A80'
const BORDER = '#1E1E26'

function emailLayout(content: string, previewText: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${SITE_NAME}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BG_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <span style="display:none;font-size:1px;color:${BG_DARK};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_DARK};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 32px 0;">
              <span style="font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                <span style="color:${PINK};">Mixzo</span><span style="color:${TEXT_PRIMARY};">Kickz</span>
              </span>
            </td>
          </tr>
          <!-- Content Card -->
          <tr>
            <td style="background-color:${BG_CARD};border-radius:16px;border:1px solid ${BORDER};padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 0 0 0;">
              <p style="margin:0 0 8px 0;font-size:13px;color:${TEXT_MUTED};">${SITE_NAME} &mdash; ${BUSINESS_LOCATION}</p>
              <p style="margin:0 0 8px 0;font-size:13px;color:${TEXT_MUTED};">${BUSINESS_PHONE} &bull; ${BUSINESS_EMAIL}</p>
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};">
                <a href="${SITE_URL}" style="color:${CYAN};text-decoration:none;">Visit our store</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)
}

interface OrderEmailData {
  order_number: string
  customer_email: string
  customer_name: string
  items: Array<{ product_id?: string; name: string; size: string; quantity: number; price: number; image_url?: string | null }>
  subtotal: number
  discount: number
  gift_card_amount: number
  shipping: number
  total: number
  shipping_address: {
    line1: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="60" valign="top">
              ${item.image_url
                ? `<img src="${item.image_url}" alt="${item.name}" width="56" height="56" style="border-radius:8px;object-fit:cover;background:${BG_ELEVATED};" />`
                : `<div style="width:56px;height:56px;border-radius:8px;background:${BG_ELEVATED};"></div>`
              }
            </td>
            <td style="padding-left:12px;" valign="top">
              <p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">${item.name}</p>
              <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};">Size ${item.size} &times; ${item.quantity}</p>
            </td>
            <td width="80" align="right" valign="top">
              <p style="margin:0;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">${formatUSD(item.price * item.quantity)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const addr = data.shipping_address
  const content = `
    <!-- Success Banner -->
    <div style="text-align:center;padding:0 0 24px 0;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${PINK};line-height:56px;text-align:center;font-size:24px;">&#10003;</div>
      <h1 style="margin:16px 0 4px 0;font-size:24px;font-weight:700;color:${TEXT_PRIMARY};">Order Confirmed</h1>
      <p style="margin:0;font-size:15px;color:${TEXT_SECONDARY};">Thank you for your purchase, ${data.customer_name || 'there'}!</p>
    </div>

    <!-- Order Number -->
    <div style="background:${BG_ELEVATED};border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px 0;font-size:12px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1px;">Order Number</p>
      <p style="margin:0;font-size:20px;font-weight:700;background:linear-gradient(135deg,${PINK},${CYAN});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${data.order_number}</p>
    </div>

    <!-- Items -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemsHtml}
    </table>

    <!-- Totals -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${TEXT_SECONDARY};">Subtotal</td>
        <td align="right" style="padding:6px 0;font-size:14px;color:${TEXT_PRIMARY};">${formatUSD(data.subtotal)}</td>
      </tr>
      ${data.discount > 0 ? `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${PINK};">Discount</td>
        <td align="right" style="padding:6px 0;font-size:14px;color:${PINK};">-${formatUSD(data.discount)}</td>
      </tr>` : ''}
      ${data.gift_card_amount > 0 ? `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${CYAN};">Gift Card</td>
        <td align="right" style="padding:6px 0;font-size:14px;color:${CYAN};">-${formatUSD(data.gift_card_amount)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${TEXT_SECONDARY};">Shipping</td>
        <td align="right" style="padding:6px 0;font-size:14px;color:${TEXT_PRIMARY};">${data.shipping === 0 ? 'Free' : formatUSD(data.shipping)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0 0;border-top:1px solid ${BORDER};font-size:18px;font-weight:700;color:${TEXT_PRIMARY};">Total</td>
        <td align="right" style="padding:12px 0 0 0;border-top:1px solid ${BORDER};font-size:18px;font-weight:700;color:${TEXT_PRIMARY};">${formatUSD(data.total)}</td>
      </tr>
    </table>

    <!-- Shipping Address -->
    <div style="margin-top:24px;padding:16px;background:${BG_ELEVATED};border-radius:12px;">
      <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1px;">Shipping To</p>
      <p style="margin:0;font-size:14px;color:${TEXT_PRIMARY};line-height:1.5;">
        ${data.customer_name}<br>
        ${addr.line1}<br>
        ${addr.city}, ${addr.state} ${addr.postal_code}
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}/orders/lookup" style="display:inline-block;padding:14px 32px;background:${PINK};color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">Track Your Order</a>
    </div>

    <p style="margin:24px 0 0 0;font-size:13px;color:${TEXT_MUTED};text-align:center;">
      You'll receive another email when your order ships with tracking info.
    </p>
  `

  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: [data.customer_email],
    subject: `Order Confirmed — ${data.order_number}`,
    html: emailLayout(content, `Your order ${data.order_number} has been confirmed! We're getting your kicks ready.`),
  })

  if (error) {
    console.error('Resend email error:', error)
    throw error
  }
}

interface ShippingEmailData {
  order_number: string
  customer_email: string
  customer_name: string
  tracking_number: string
  tracking_url: string
  items: Array<{ name: string; size: string; quantity: number }>
}

export async function sendShippingNotification(data: ShippingEmailData) {
  const itemsList = data.items.map(item =>
    `<li style="padding:4px 0;font-size:14px;color:${TEXT_SECONDARY};">${item.name} — Size ${item.size} &times; ${item.quantity}</li>`
  ).join('')

  const content = `
    <div style="text-align:center;padding:0 0 24px 0;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${CYAN};line-height:56px;text-align:center;font-size:24px;">&#128230;</div>
      <h1 style="margin:16px 0 4px 0;font-size:24px;font-weight:700;color:${TEXT_PRIMARY};">Your Order Has Shipped!</h1>
      <p style="margin:0;font-size:15px;color:${TEXT_SECONDARY};">${data.customer_name || 'Hey'}, your kicks are on the way.</p>
    </div>

    <div style="background:${BG_ELEVATED};border-radius:12px;padding:16px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0 0 4px 0;font-size:12px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1px;">Order</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:${TEXT_PRIMARY};">${data.order_number}</p>
          </td>
          <td align="right">
            <p style="margin:0 0 4px 0;font-size:12px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1px;">Tracking</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:${CYAN};">${data.tracking_number}</p>
          </td>
        </tr>
      </table>
    </div>

    <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">Items in this shipment:</h3>
    <ul style="margin:0 0 24px 0;padding-left:20px;">${itemsList}</ul>

    <div style="text-align:center;">
      <a href="${data.tracking_url}" style="display:inline-block;padding:14px 32px;background:${CYAN};color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">Track Package</a>
    </div>
  `

  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: [data.customer_email],
    subject: `Your Order Has Shipped — ${data.order_number}`,
    html: emailLayout(content, `Great news! Your order ${data.order_number} is on its way.`),
  })

  if (error) {
    console.error('Resend shipping email error:', error)
    throw error
  }
}

interface CleaningEmailData {
  customer_email: string
  customer_name: string
  items: Array<{ name: string; size: string; tier: string }>
  order_number: string
  total: number
}

export async function sendCleaningConfirmation(data: CleaningEmailData) {
  const itemsList = data.items.map(item => {
    const label = item.tier === 'cleaning' ? 'Sneaker Cleaning' : 'Cleaning + Icing'
    const price = item.tier === 'cleaning' ? 20 : 30
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT_PRIMARY};">${item.name} — Size ${item.size}</td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${CYAN};">${label} — ${formatUSD(price)}</td>
      </tr>`
  }).join('')

  const content = `
    <div style="text-align:center;padding:0 0 24px 0;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${CYAN};line-height:56px;text-align:center;font-size:24px;">&#10024;</div>
      <h1 style="margin:16px 0 4px 0;font-size:24px;font-weight:700;color:${TEXT_PRIMARY};">Cleaning Service Confirmed</h1>
      <p style="margin:0;font-size:15px;color:${TEXT_SECONDARY};">We'll get your kicks looking fresh, ${data.customer_name || 'there'}!</p>
    </div>

    <div style="background:${BG_ELEVATED};border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px 0;font-size:12px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1px;">Order</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:${TEXT_PRIMARY};">${data.order_number}</p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemsList}
    </table>

    <p style="margin:24px 0 0 0;font-size:13px;color:${TEXT_MUTED};text-align:center;line-height:1.6;">
      Your sneakers will be cleaned by our team. We'll send updates as we work on them.<br>
      Typical turnaround: 3-7 business days.
    </p>

    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}/orders/lookup" style="display:inline-block;padding:14px 32px;background:${PINK};color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">Check Status</a>
    </div>
  `

  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: [data.customer_email],
    subject: `Cleaning Service Confirmed — ${data.order_number}`,
    html: emailLayout(content, `Your sneaker cleaning for order ${data.order_number} is confirmed!`),
  })

  if (error) {
    console.error('Resend cleaning email error:', error)
    throw error
  }
}

interface AbandonedCartEmailData {
  customer_email: string
  customer_name?: string
  items: Array<{ name: string; size: string; price: number; image_url?: string | null }>
  cart_total: number
}

export async function sendAbandonedCartEmail(data: AbandonedCartEmailData) {
  const itemsHtml = data.items.slice(0, 3).map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="60" valign="top">
              ${item.image_url
                ? `<img src="${item.image_url}" alt="${item.name}" width="56" height="56" style="border-radius:8px;object-fit:cover;background:${BG_ELEVATED};" />`
                : `<div style="width:56px;height:56px;border-radius:8px;background:${BG_ELEVATED};"></div>`
              }
            </td>
            <td style="padding-left:12px;" valign="top">
              <p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">${item.name}</p>
              <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};">Size ${item.size}</p>
            </td>
            <td width="80" align="right" valign="top">
              <p style="margin:0;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">${formatUSD(item.price)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const content = `
    <div style="text-align:center;padding:0 0 24px 0;">
      <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:${TEXT_PRIMARY};">You Left Some Fire Behind</h1>
      <p style="margin:0;font-size:15px;color:${TEXT_SECONDARY};">Your cart is waiting, ${data.customer_name || 'sneakerhead'}. Don't let someone else grab these.</p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemsHtml}
    </table>

    ${data.items.length > 3 ? `<p style="margin:12px 0 0 0;font-size:13px;color:${TEXT_MUTED};text-align:center;">+ ${data.items.length - 3} more item${data.items.length - 3 > 1 ? 's' : ''}</p>` : ''}

    <div style="background:${BG_ELEVATED};border-radius:12px;padding:16px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 4px 0;font-size:13px;color:${TEXT_MUTED};">Cart Total</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:${TEXT_PRIMARY};">${formatUSD(data.cart_total)}</p>
    </div>

    <div style="text-align:center;">
      <a href="${SITE_URL}/cart" style="display:inline-block;padding:14px 32px;background:${PINK};color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">Complete Your Order</a>
    </div>

    <p style="margin:24px 0 0 0;font-size:12px;color:${TEXT_MUTED};text-align:center;">
      Sneakers sell fast. Grab yours before they're gone.
    </p>
  `

  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: [data.customer_email],
    subject: `Don't forget your kicks! Your cart is waiting`,
    html: emailLayout(content, `You left ${data.items.length} item${data.items.length > 1 ? 's' : ''} in your cart. Complete your order before they sell out.`),
  })

  if (error) {
    console.error('Resend abandoned cart email error:', error)
    throw error
  }
}
