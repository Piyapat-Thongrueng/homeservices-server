import pool from "../utils/db.mjs"



// ======================================
// CHECK CHAT ACCESS
// ======================================

export async function validateChatAccess(order_id, user_id) {

  // 1. ดึง order
  const orderQuery = `
    SELECT id, user_id, technician_id, status, service_status
    FROM orders
    WHERE id = $1
  `
  const { rows: orderRows } = await pool.query(orderQuery, [order_id])

  const order = orderRows[0]

  if (!order) {
    throw new Error("Order not found")
  }

  // 2. เงื่อนไขเปิดแชท (ปรับให้ตรง flow เรา)
  if (order.status !== "paid") {
    throw new Error("Chat not available until payment")
  }

  if (order.service_status === "completed") {
    throw new Error("Chat is closed")
  }

  // ต้อง assign แล้วเท่านั้น
  if (!order.technician_id) {
    throw new Error("Chat not available yet")
  }

  // 3. เช็คสิทธิ์
  const isCustomer = user_id === order.user_id
  const isTechnician = user_id === order.technician_id

  if (!isCustomer && !isTechnician) {
    throw new Error("Unauthorized")
  }

  return {
    order,
    role: isCustomer ? "customer" : "technician"
  }
}



// ======================================
// SEND MESSAGE
// ======================================

export async function sendMessage({ order_id, sender_id, message }) {

  const { role } = await validateChatAccess(order_id, sender_id)

  const insertQuery = `
    INSERT INTO messages (order_id, sender_id, sender_role, message, is_read)
    VALUES ($1, $2, $3, $4, false)
    RETURNING *
  `

  const { rows } = await pool.query(insertQuery, [
    order_id,
    sender_id,
    role,
    message
  ])

  return rows[0]
}



// ======================================
// GET MESSAGES
// ======================================

export async function getMessages(orderId, userId, page = 1) {

  await validateChatAccess(orderId, userId)

  const limit = 30
  const offset = (page - 1) * limit

  const query = `
    SELECT *
    FROM messages
    WHERE order_id = $1
    ORDER BY created_at ASC
    LIMIT $2 OFFSET $3
  `

  const { rows } = await pool.query(query, [
    orderId,
    limit,
    offset
  ])

  return rows
}



// ======================================
// MARK READ
// ======================================

export async function markAsRead(orderId, userId) {

  await validateChatAccess(orderId, userId)

  const query = `
    UPDATE messages
    SET is_read = true
    WHERE order_id = $1
      AND sender_id != $2
      AND is_read = false
  `

  await pool.query(query, [orderId, userId])

  return true
}



// ======================================
// UNREAD COUNT
// ======================================

export async function getUnreadCount(orderId, userId) {

  await validateChatAccess(orderId, userId)

  const query = `
    SELECT COUNT(*)::int AS count
    FROM messages
    WHERE order_id = $1
      AND is_read = false
      AND sender_id != $2
  `

  const { rows } = await pool.query(query, [orderId, userId])

  return rows[0].count
}