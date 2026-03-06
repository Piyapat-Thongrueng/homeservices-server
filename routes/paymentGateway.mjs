import express from 'express';
import Stripe from 'stripe';
import pool from '../utils/db.mjs';

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * GET /api/payment/config
 * Return publishable key for client-side Stripe.js.
 */
router.get('/config', (req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return res.status(500).json({ error: 'Stripe publishable key not configured.' });
  }
  res.status(200).json({ publishableKey });
});

/**
 * GET /api/payment/promotion/validate?code=XXXX
 * Validate promotion code against promotions table.
 * Returns: { valid: boolean, discountPercent?: number, promotionId?: number, message?: string }
 */
router.get('/promotion/validate', async (req, res) => {
  try {
    const rawCode = req.query.code;
    if (typeof rawCode !== 'string') {
      return res.status(400).json({ error: 'Missing promotion code.' });
    }

    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'Missing promotion code.' });
    }

    const result = await pool.query(
      `SELECT id, code, discount_percent, expires_at, active
       FROM promotions
       WHERE UPPER(code) = $1
         AND (active IS TRUE OR active IS NULL)
         AND (expires_at IS NULL OR expires_at > now())
       LIMIT 1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        valid: false,
        message: 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุแล้ว',
      });
    }

    const promo = result.rows[0];

    return res.status(200).json({
      valid: true,
      promotionId: promo.id,
      discountPercent: promo.discount_percent ?? 0,
    });
  } catch (err) {
    console.error('Validate promotion code error:', err);
    res.status(500).json({ error: 'ไม่สามารถตรวจสอบโค้ดส่วนลดได้' });
  }
});

/**
 * POST /api/payment/create-checkout-session
 * Creates a pending order, Stripe Checkout Session, and returns the session URL.
 * Body: {
 *   authUserId: string (Supabase auth user UUID),
 *   addressId?: number (optional if address is provided),
 *   address?: { address_line, city?, province?, postal_code? } (optional, used to create address if addressId not set),
 *   promotionId?: number,
 *   items: [{ serviceId, name, quantity, price }],
 *   discountAmount: number,
 *   successUrl: string,
 *   cancelUrl: string,
 *   paymentType: 'CR' | 'QR' // CR = credit card, QR = PromptPay
 * }
 */
router.post('/create-checkout-session', express.json(), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured.' });
  }

  try {
    const {
      authUserId,
      addressId: providedAddressId,
      address: addressPayload,
      promotionId,
      items,
      discountAmount = 0,
      successUrl,
      cancelUrl,
      paymentType = 'CR',
    } = req.body;

    if (!authUserId || !Array.isArray(items) || items.length === 0 || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Missing required fields: authUserId, items, successUrl, cancelUrl',
      });
    }

    // Resolve internal user id from Supabase auth user id
    const userRes = await pool.query(
      'SELECT id FROM users WHERE auth_user_id = $1',
      [authUserId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userId = userRes.rows[0].id;

    let addressId = providedAddressId;
    if (!addressId && addressPayload?.address_line) {
      const addrRes = await pool.query(
        `INSERT INTO addresses (user_id, address_line, city, province, postal_code)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          userId,
          addressPayload.address_line,
          addressPayload.city ?? null,
          addressPayload.province ?? null,
          addressPayload.postal_code ?? null,
        ]
      );
      addressId = addrRes.rows[0].id;
    }
    if (!addressId) {
      return res.status(400).json({
        error: 'Either addressId or address (with address_line) is required.',
      });
    }

    const totalPrice = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
    const netPrice = Math.max(0, totalPrice - Number(discountAmount));

    // Create order in DB (pending)
    const orderRes = await pool.query(
      `INSERT INTO orders (
        user_id, address_id, promotion_id,
        status, payment_type, total_price, discount_amount, net_price
      ) VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
      RETURNING id`,
      [
        userId,
        addressId,
        promotionId ?? null,
        paymentType,
        totalPrice,
        discountAmount,
        netPrice,
      ]
    );
    const orderId = orderRes.rows[0].id;

    // Insert order_items
    for (const it of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, service_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, it.serviceId, it.quantity, it.price]
      );
    }

    // Stripe amounts in THB are in satang (1 THB = 100 satang). Stripe does not allow negative line amounts.
    const lineItems =
      discountAmount > 0
        ? [
            {
              price_data: {
                currency: 'thb',
                product_data: {
                  name: 'รายการบริการ (หลังหักส่วนลด)',
                },
                unit_amount: Math.round(netPrice * 100),
              },
              quantity: 1,
            },
          ]
        : items.map((it) => ({
            price_data: {
              currency: 'thb',
              product_data: {
                name: it.name || `Service #${it.serviceId}`,
              },
              unit_amount: Math.round(Number(it.price) * 100),
            },
            quantity: it.quantity,
          }));

    const paymentMethodTypes =
      paymentType === 'QR' ? ['promptpay'] : ['card'];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orderId: String(orderId) },
      client_reference_id: String(orderId),
    });

    // Store Stripe session_id on order
    await pool.query(
      'UPDATE orders SET session_id = $1, updated_at = now() WHERE id = $2',
      [session.id, orderId]
    );

    res.status(200).json({
      url: session.url,
      sessionId: session.id,
      orderId,
    });
  } catch (err) {
    console.error('Create checkout session error:', err);
    res.status(500).json({
      error: err.message || 'Failed to create checkout session.',
    });
  }
});

/**
 * GET /api/payment/session/:sessionId
 * Returns session status and order info for the success page.
 */
router.get('/session/:sessionId', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured.' });
  }

  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    if (!session.metadata?.orderId) {
      return res.status(404).json({ error: 'Order not found for this session.' });
    }

    const orderId = session.metadata.orderId;

    // If payment is completed but webhook hasn't updated yet, ensure status is set to completed here as a fallback.
    if (session.payment_status === 'paid') {
      try {
        await pool.query(
          `UPDATE orders SET status = 'completed', updated_at = now() WHERE id = $1`,
          [orderId]
        );
      } catch (e) {
        console.error('Failed to update order status in session endpoint:', e);
      }
    }

    const orderRes = await pool.query(
      `SELECT o.id, o.status, o.net_price, o.total_price, o.discount_amount, o.created_at
       FROM orders o WHERE o.id = $1`,
      [orderId]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    const itemsRes = await pool.query(
      `SELECT oi.service_id, oi.quantity, oi.price, s.name
       FROM order_items oi
       JOIN services s ON s.id = oi.service_id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.status(200).json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      order: {
        id: order.id,
        status: order.status,
        netPrice: Number(order.net_price),
        totalPrice: Number(order.total_price),
        discountAmount: Number(order.discount_amount),
        createdAt: order.created_at,
        items: itemsRes.rows.map((r) => ({
          serviceId: r.service_id,
          name: r.name,
          quantity: r.quantity,
          price: Number(r.price),
        })),
      },
    });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: err.message || 'Failed to get session.' });
  }
});

/**
 * Stripe webhook handler (must be mounted with express.raw() in app.mjs).
 * Verifies signature and on checkout.session.completed updates order status to 'completed'.
 */
export async function stripeWebhookHandler(req, res) {
  if (!stripe) {
    return res.status(503).send('Stripe not configured');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !sig) {
    return res.status(400).send('Missing webhook secret or signature');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      try {
        await pool.query(
          `UPDATE orders SET status = 'completed', updated_at = now() WHERE id = $1`,
          [orderId]
        );
      } catch (err) {
        console.error('Failed to update order status after payment:', err);
      }
    }
  }

  res.status(200).send('OK');
}
// Auto-cancel pending orders that have not completed within 5 minutes
const ORDER_TIMEOUT_MINUTES = 5;
setInterval(async () => {
  try {
    await pool.query(
      `UPDATE orders
       SET status = 'cancelled', updated_at = now()
       WHERE status = 'pending'
         AND created_at < now() - INTERVAL '${ORDER_TIMEOUT_MINUTES} minutes'`
    );
  } catch (err) {
    console.error("Failed to auto-cancel pending orders:", err);
  }
}, 60 * 1000);


export default router;
