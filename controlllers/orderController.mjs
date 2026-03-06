import orderService from "../services/orderService.mjs";

const getMyOrders = async (req, res) => {
  try {

    const orders = await orderService.getMyOrders(
      req.params.userId
    );

    res.json(orders);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }
};

const createMockOrder = async (req, res) => {

  try {

    const result = await orderService.createMockOrder(
      req.body.auth_user_id
    );

    res.status(201).json(result);

  } catch (error) {

    res.status(500).json({
      error: "เกิดข้อผิดพลาด: " + error.message
    });

  }

};

export default {
  getMyOrders,
  createMockOrder
};