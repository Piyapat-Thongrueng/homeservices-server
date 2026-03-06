import pool from "../utils/db.mjs";

const getDashboardStats = async () => {

  const users = await pool.query(
    "SELECT COUNT(*) FROM users"
  );

  const orders = await pool.query(
    "SELECT COUNT(*) FROM orders"
  );

  const services = await pool.query(
    "SELECT COUNT(*) FROM services"
  );

  return {
    users: users.rows[0].count,
    orders: orders.rows[0].count,
    services: services.rows[0].count
  };

};

const getUsers = async () => {

  const { rows } = await pool.query(
    "SELECT * FROM users ORDER BY id DESC"
  );

  return rows;

};

const getOrders = async () => {

  const { rows } = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );

  return rows;

};

export default {
  getDashboardStats,
  getUsers,
  getOrders
};