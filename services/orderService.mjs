import orderRepository from "../repositories/orderRepository.mjs";

const getMyOrders = async (userId) => {

  const rows = await orderRepository.getOrdersByUser(userId);

  // จัดรูปแบบข้อมูลเล็กน้อยก่อนส่งกลับ (Format วันที่, ราคา)
  const formattedOrders = rows.map(order => ({
    id: `AD${String(order.id).padStart(8, '0')}`, // จำลองรหัสออเดอร์ เช่น AD00000012
    status: order.status,
    date: new Date(order.date).toLocaleString('th-TH', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }) + ' น.',
    worker: order.worker || 'รอการจัดสรรช่าง',
    price: Number(order.price).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
    details: order.details.filter(d => d !== null)
  }));

  return formattedOrders;

};

const createMockOrder = async (authUserId) => {

  return orderRepository.createMockOrder(authUserId);

};

export default {
  getMyOrders,
  createMockOrder
};