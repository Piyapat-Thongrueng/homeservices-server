import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY);

const requireAuth = async (req, res, next) => {

  try {

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid token"
      });
    }

    req.user = data.user;

    next();

  } catch (err) {

    return res.status(500).json({
      error: "Auth middleware error"
    });

  }

};

export default requireAuth;