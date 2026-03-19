import express from 'express';
import pool from '../utils/db.mjs';
import cartService from "../services/cartService.mjs";

const router = express.Router();

/**
 * GET /api/cart?authUserId=uuid
 * Returns all cart items for the user with service name, image, address, and details.
 */
router.get('/', async (req, res) => {
  try {
    const authUserId = typeof req.query.authUserId === 'string' ? req.query.authUserId.trim() : '';
    if (!authUserId) {
      return res.status(400).json({ error: 'authUserId is required.' });
    }
    const userRes = await pool.query('SELECT id FROM users WHERE auth_user_id = $1', [authUserId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userId = userRes.rows[0].id;
    const cartItems = await cartService.listForUser(userId);

    res.status(200).json({ cartItems });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Failed to get cart.' });
  }
});

/**
 * POST /api/cart
 * Create a new cart item (add to cart).
 * Body: {
 *   authUserId, serviceId, addressId?, address?,
 *   appointmentDate, appointmentTime, remark?,
 *   items: [{ serviceItemId, quantity, pricePerUnit }]
 * }
 */
router.post('/', express.json(), async (req, res) => {
  try {
    const {
      authUserId,
      serviceId,
      addressId: providedAddressId,
      address: addressPayload,
      appointmentDate,
      appointmentTime,
      remark,
      items,
    } = req.body;

    if (!authUserId || !serviceId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'authUserId, serviceId, and items (array) are required.',
      });
    }

    const userRes = await pool.query('SELECT id FROM users WHERE auth_user_id = $1', [authUserId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userId = userRes.rows[0].id;

    const created = await cartService.create({
      userId,
      serviceId,
      addressId: providedAddressId,
      appointmentDate,
      appointmentTime,
      remark,
      items,
      addressPayload,
    });

    if (!created.cartItemId) {
      return res.status(400).json({
        error: 'Either addressId or address (with address_line) is required.',
      });
    }

    res.status(201).json({ cartItemId: created.cartItemId, addressId: created.addressId });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add to cart.' });
  }
});

/**
 * PUT /api/cart/:id
 * Update an existing cart item (no new row).
 */
router.put('/:id', express.json(), async (req, res) => {
  try {
    const cartItemId = Number(req.params.id);
    if (!Number.isFinite(cartItemId)) {
      return res.status(400).json({ error: 'Invalid cart item id.' });
    }
    const {
      authUserId,
      addressId: providedAddressId,
      address: addressPayload,
      appointmentDate,
      appointmentTime,
      remark,
      items,
    } = req.body;

    if (!authUserId) {
      return res.status(400).json({ error: 'authUserId is required.' });
    }

    const userRes = await pool.query('SELECT id FROM users WHERE auth_user_id = $1', [authUserId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userId = userRes.rows[0].id;

    const existing = await pool.query(
      'SELECT id FROM cart_items WHERE id = $1 AND user_id = $2',
      [cartItemId, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    const updated = await cartService.update({
      cartItemId,
      userId,
      addressId: providedAddressId,
      addressPayload,
      appointmentDate,
      appointmentTime,
      remark,
      items,
    });

    if (!updated.ok) {
      return res.status(400).json({
        error: 'Either addressId or address (with address_line) is required.',
      });
    }

    res.status(200).json({ ok: true, cartItemId });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

/**
 * DELETE /api/cart/:id?authUserId=uuid
 * Delete a cart item and its details.
 */
router.delete('/:id', async (req, res) => {
  try {
    const cartItemId = Number(req.params.id);
    const authUserId = typeof req.query.authUserId === 'string' ? req.query.authUserId.trim() : '';
    if (!Number.isFinite(cartItemId) || !authUserId) {
      return res.status(400).json({ error: 'Invalid id or authUserId required.' });
    }

    const userRes = await pool.query('SELECT id FROM users WHERE auth_user_id = $1', [authUserId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userId = userRes.rows[0].id;

    const deleted = await cartService.delete({
      cartItemId,
      userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ error: 'Failed to delete cart item.' });
  }
});

export default router;
