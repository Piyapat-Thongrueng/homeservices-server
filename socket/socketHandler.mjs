import { sendMessage, validateChatAccess } from "../services/chatService.mjs"

export const initSocket = (io) => {

  // รองรับหลาย device ต่อ user
  const onlineUsers = new Map()

  io.on("connection", (socket) => {

    console.log("🔌 Connected:", socket.id)

    // =============================
    // USER ONLINE
    // =============================
    socket.on("user_online", ({ userId }) => {
      if (!userId) return

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set())
      }

      onlineUsers.get(userId).add(socket.id)

      io.emit("online_users", Array.from(onlineUsers.keys()))
    })


    // =============================
    // JOIN ROOM
    // =============================
    socket.on("join_room", async ({ orderId, userId }) => {
      try {

        if (!orderId || !userId) return

        // เช็คสิทธิ์ก่อน join
        await validateChatAccess(orderId, userId)

        socket.join(String(orderId))

      } catch (err) {
        console.log("❌ join denied:", err.message)
        socket.emit("error", "Unauthorized")
      }
    })


    // =============================
    // SEND MESSAGE (สำคัญสุด)
    // =============================
    socket.on("send_message", async (data) => {
      try {

        const { order_id, sender_id, message } = data

        if (!order_id || !sender_id || !message?.trim()) return

        // save DB ก่อน
        const savedMessage = await sendMessage({
          order_id,
          sender_id,
          message: message.trim()
        })

        //  broadcast
        io.to(String(order_id)).emit("receive_message", savedMessage)

      } catch (err) {
        console.log("❌ send_message error:", err.message)
        socket.emit("error", err.message)
      }
    })


    // =============================
    // CLOSE CHAT
    // =============================
    socket.on("close_room", (orderId) => {
      io.to(String(orderId)).emit("chat_closed")
    })


    // =============================
    // DISCONNECT
    // =============================
    socket.on("disconnect", () => {

      for (const [userId, sockets] of onlineUsers.entries()) {

        sockets.delete(socket.id)

        if (sockets.size === 0) {
          onlineUsers.delete(userId)
        }
      }

      io.emit("online_users", Array.from(onlineUsers.keys()))
    })

  })
}