import pool from "../utils/db.mjs";

const getAllCategories = async () => {

  const { rows } = await pool.query(
    "SELECT * FROM categories ORDER BY id"
  );

  return rows;

};

const getCategoryById = async (id) => {

  const { rows } = await pool.query(
    "SELECT * FROM categories WHERE id = $1",
    [id]
  );

  return rows[0];

};

const createCategory = async (name) => {

  const { rows } = await pool.query(
    "INSERT INTO categories (name) VALUES ($1) RETURNING *",
    [name]
  );

  return rows[0];

};

const updateCategory = async (id, name) => {

  const { rows } = await pool.query(
    "UPDATE categories SET name = $1 WHERE id = $2 RETURNING *",
    [name, id]
  );

  return rows[0];

};

const deleteCategory = async (id) => {

  await pool.query(
    "DELETE FROM categories WHERE id = $1",
    [id]
  );

};

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};