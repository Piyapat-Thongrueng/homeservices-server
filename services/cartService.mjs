import pool from "../utils/db.mjs";
import { findOrInsertAddress } from "../utils/addressHelper.mjs";

const cartService = {
  listForUser: async (userId) => {
    const cartRes = await pool.query(
      `SELECT
        ci.id AS cart_item_id,
        ci.service_id,
        ci.address_id,
        ci.cart_appointment_date AS appointment_date,
        ci.cart_appointment_time AS appointment_time,
        ci.cart_remark AS remark,
        s.name AS service_name,
        s.image AS service_image,
        a.address_line,
        a.district,
        a.subdistrict,
        a.province,
        a.postal_code
       FROM cart_items ci
       JOIN services s ON s.id = ci.service_id
       LEFT JOIN addresses a ON a.id = ci.address_id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [userId],
    );

    const cartItems = [];
    for (const row of cartRes.rows) {
      const detailsRes = await pool.query(
        `SELECT
          cid.id,
          cid.service_item_id,
          cid.quantity,
          cid.price_per_unit,
          si.name AS item_name,
          si.unit
         FROM cart_item_details cid
         JOIN service_items si ON si.id = cid.service_item_id
         WHERE cid.cart_item_id = $1
         ORDER BY cid.id`,
        [row.cart_item_id],
      );

      const total = detailsRes.rows.reduce(
        (sum, d) => sum + Number(d.price_per_unit) * Number(d.quantity),
        0,
      );

      cartItems.push({
        id: row.cart_item_id,
        serviceId: row.service_id,
        serviceName: row.service_name,
        serviceImage: row.service_image || null,
        addressId: row.address_id,
        addressLine: row.address_line,
        district: row.district,
        subdistrict: row.subdistrict,
        province: row.province,
        postalCode: row.postal_code,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        remark: row.remark,
        details: detailsRes.rows.map((d) => ({
          id: d.id,
          serviceItemId: d.service_item_id,
          name: d.item_name,
          unit: d.unit,
          quantity: d.quantity,
          pricePerUnit: Number(d.price_per_unit),
        })),
        total,
      });
    }

    return cartItems;
  },

  create: async ({
    userId,
    serviceId,
    addressId,
    appointmentDate,
    appointmentTime,
    remark,
    items,
    addressPayload,
  }) => {
    let resolvedAddressId = addressId != null ? Number(addressId) : null;
    if (!resolvedAddressId && addressPayload?.address_line) {
      resolvedAddressId = await findOrInsertAddress(userId, addressPayload);
    }
    if (!resolvedAddressId) {
      return { cartItemId: null, addressId: null };
    }

    const cartRes = await pool.query(
      `INSERT INTO cart_items (user_id, service_id, address_id, cart_appointment_date, cart_appointment_time, cart_remark)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        userId,
        serviceId,
        resolvedAddressId,
        appointmentDate || null,
        appointmentTime || null,
        remark ?? null,
      ],
    );

    const cartItemId = cartRes.rows[0].id;
    for (const it of items) {
      await pool.query(
        `INSERT INTO cart_item_details (cart_item_id, service_item_id, quantity, price_per_unit)
         VALUES ($1, $2, $3, $4)`,
        [cartItemId, it.serviceItemId, it.quantity, it.pricePerUnit],
      );
    }

    return { cartItemId, addressId: resolvedAddressId };
  },

  update: async ({
    cartItemId,
    userId,
    addressId,
    addressPayload,
    appointmentDate,
    appointmentTime,
    remark,
    items,
  }) => {
    let resolvedAddressId = addressId != null ? Number(addressId) : null;
    if (!resolvedAddressId && addressPayload?.address_line) {
      resolvedAddressId = await findOrInsertAddress(userId, addressPayload);
    }
    if (!resolvedAddressId) {
      return { ok: false, reason: "missing_address" };
    }

    await pool.query(
      `UPDATE cart_items
       SET address_id = $1, cart_appointment_date = $2, cart_appointment_time = $3, cart_remark = $4, updated_at = now()
       WHERE id = $5 AND user_id = $6`,
      [
        resolvedAddressId,
        appointmentDate || null,
        appointmentTime || null,
        remark ?? null,
        cartItemId,
        userId,
      ],
    );

    if (Array.isArray(items) && items.length > 0) {
      await pool.query(
        "DELETE FROM cart_item_details WHERE cart_item_id = $1",
        [cartItemId],
      );
      for (const it of items) {
        await pool.query(
          `INSERT INTO cart_item_details (cart_item_id, service_item_id, quantity, price_per_unit)
           VALUES ($1, $2, $3, $4)`,
          [cartItemId, it.serviceItemId, it.quantity, it.pricePerUnit],
        );
      }
    }

    return { ok: true };
  },

  delete: async ({ cartItemId, userId }) => {
    await pool.query("DELETE FROM cart_item_details WHERE cart_item_id = $1", [
      cartItemId,
    ]);

    const del = await pool.query(
      "DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id",
      [cartItemId, userId],
    );

    return del.rows.length > 0;
  },
};

export default cartService;

