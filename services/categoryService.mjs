import connectionPool from "../utils/db.mjs";

const categoryService = {
  listAll: async () => {
    const result = await connectionPool.query("SELECT * FROM categories");
    return result.rows;
  },

  findById: async (id) => {
    const result = await connectionPool.query(
      "SELECT * FROM categories WHERE id = $1",
      [id],
    );
    return result.rows;
  },

  create: async ({ name }) => {
    const result = await connectionPool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      [name],
    );
    return result.rows[0];
  },

  update: async ({ id, name }) => {
    const result = await connectionPool.query(
      "UPDATE categories SET name = $1 WHERE id = $2 RETURNING *",
      [name, id],
    );
    return result.rows[0] ?? null;
  },

  deleteById: async (id) => {
    const result = await connectionPool.query(
      "DELETE FROM categories WHERE id = $1 RETURNING *",
      [id],
    );
    return result.rows[0] ?? null;
  },
};

export default categoryService;

