import express from "express"
import uploadService from "../services/uploadService.mjs"

const router = express.Router()

router.post("/upload", async (req, res) => {

  try {

    const { file } = req.body

    if (!file) {
      return res.status(400).json({ error: "No file" })
    }

    const url = await uploadService.uploadChatImageFromBase64({ fileBase64: file })
    res.json({ url })

  } catch (err) {
    console.error(err)
    if (err?.statusCode === 400 && err?.payload) {
      return res.status(400).json(err.payload)
    }
    res.status(500).json({ error: "Upload failed" })
  }

})

export default router