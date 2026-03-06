import serviceRepository from "../repositories/serviceRepository.mjs";

const getAllServices = async () => {
  return serviceRepository.getAllServices();
};

const getServiceById = async (id) => {
  const service = await serviceRepository.getServiceById(id);

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
};

const createService = async (data, files) => {
  return serviceRepository.createService(data, files);
};

const updateService = async (id, data, files) => {
  return serviceRepository.updateService(id, data, files);
};

const deleteService = async (id) => {
  return serviceRepository.deleteService(id);
};

export default {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};