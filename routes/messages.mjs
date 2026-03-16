import express from "express"
import { randomUUID } from "crypto"
import { getSupabase } from "../utils/supabaseClient.mjs"

const router = express.Router()

// =============================
// SEND TEXT MESSAGE
// =============================

router.post("/messages", async (req, res) => {

  try {

    console.log("BODY:", req.body)

    const { order_id, sender_id, message } = req.body

    if (!order_id || !sender_id || !message) {

      console.log("❌ Missing required fields")

      return res.status(400).json({
        error: "Missing required fields"
      })

    }

    const supabase = getSupabase()

    const id = randomUUID()

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          id,
          order_id,
          sender_id,
          message
        }
      ])
      .select()

    if (error) {

      console.log("❌ SUPABASE ERROR:", error)

      return res.status(400).json(error)

    }

    console.log("✅ Message inserted:", data)

    res.json(data[0])

  } catch (err) {

    console.log("❌ SERVER ERROR:", err)

    res.status(500).json({
      error: "Send message failed"
    })

  }

})


// =============================
// SEND IMAGE MESSAGE
// =============================

router.post("/messages/image", async (req, res) => {

  try {

    const { order_id, sender_id, image } = req.body

    if (!order_id || !sender_id || !image) {

      return res.status(400).json({
        error: "Missing required fields"
      })

    }

    const supabase = getSupabase()

    const id = randomUUID()

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          id,
          order_id,
          sender_id,
          image
        }
      ])
      .select()

    if (error) {

      console.log("❌ IMAGE INSERT ERROR:", error)

      return res.status(400).json(error)

    }

    res.json(data[0])

  } catch (err) {

    console.log("❌ SERVER ERROR:", err)

    res.status(500).json({
      error: "Send image failed"
    })

  }

})


// =============================
// LOAD CHAT HISTORY
// =============================

router.get("/messages/:orderId", async (req, res) => {

  try {

    const { orderId } = req.params

    let page = parseInt(req.query.page)

    if (!page || page < 1) page = 1

    const limit = 30

    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .range(from, to)

    if (error) {

      console.log("❌ LOAD ERROR:", error)

      return res.status(400).json(error)

    }

    res.json(data)

  } catch (err) {

    console.log("❌ SERVER ERROR:", err)

    res.status(500).json({
      error: "Load messages failed"
    })

  }

})


// =============================
// MARK MESSAGE AS READ
// =============================

router.put("/messages/read/:orderId", async (req, res) => {

  try {

    const { orderId } = req.params
    const { userId } = req.body

    if (!userId) {

      return res.status(400).json({
        error: "userId is required"
      })

    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("order_id", orderId)
      .neq("sender_id", userId)

    if (error) {

      console.log("❌ UPDATE ERROR:", error)

      return res.status(400).json(error)

    }

    res.json({
      success: true
    })

  } catch (err) {

    console.log("❌ SERVER ERROR:", err)

    res.status(500).json({
      error: "Update read status failed"
    })

  }

})

export default router