import serviceService from "../services/serviceService.mjs";

const getServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getService = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(
      req.params.id
    );
    res.json(service);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const createService = async (req, res) => {
  try {
    const service = await serviceService.createService(
      req.body,
      req.files
    );

    res.status(201).json(service);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await serviceService.updateService(
      req.params.id,
      req.body,
      req.files
    );

    res.json(service);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteService = async (req, res) => {
  try {

    await serviceService.deleteService(req.params.id);

    res.json({
      message: "Service deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
};