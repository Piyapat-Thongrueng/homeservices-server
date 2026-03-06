import adminService from "../services/adminService.mjs";

const getDashboard = async (req, res) => {
  try {

    const data = await adminService.getDashboard();

    res.json(data);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }
};

const getUsers = async (req, res) => {

  try {

    const users = await adminService.getUsers();

    res.json(users);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

};

const getOrders = async (req, res) => {

  try {

    const orders = await adminService.getOrders();

    res.json(orders);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

};

export default {
  getDashboard,
  getUsers,
  getOrders
};