import adminRepository from "../repositories/adminRepository.mjs";

const getDashboard = async () => {

  const stats = await adminRepository.getDashboardStats();

  return stats;

};

const getUsers = async () => {

  return adminRepository.getUsers();

};

const getOrders = async () => {

  return adminRepository.getOrders();

};

export default {
  getDashboard,
  getUsers,
  getOrders
};