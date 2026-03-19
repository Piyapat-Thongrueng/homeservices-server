import { getSupabase } from "../utils/supabaseClient.mjs";
import { randomUUID } from "crypto";

const uploadService = {
  uploadChatImageFromBase64: async ({ fileBase64 }) => {
    const supabase = getSupabase();
    const fileName = `chat/${randomUUID()}.png`;

    // base64 → buffer
    const base64Data = fileBase64.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    const { error } = await supabase.storage
      .from("chat-images")
      .upload(fileName, buffer, { contentType: "image/png" });

    if (error) {
      const err = new Error("Upload failed");
      err.statusCode = 400;
      err.payload = error;
      throw err;
    }

    const { data } = supabase.storage.from("chat-images").getPublicUrl(fileName);
    return data.publicUrl;
  },
};

export default uploadService;

