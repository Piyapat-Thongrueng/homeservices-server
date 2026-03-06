import categoryRepository from "../repositories/categoryRepository.mjs";

const getCategories = async () => {

  const categories = await categoryRepository.getAllCategories();
  return categories;

};

const getCategoryById = async (id) => {

  const category = await categoryRepository.getCategoryById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  return category;

};

const createCategory = async (data) => {

  if (!data.name) {
    throw new Error("Name is required");
  }

  return categoryRepository.createCategory(data.name);

};

const updateCategory = async (id, data) => {

  if (!data.name) {
    throw new Error("Name is required");
  }

  return categoryRepository.updateCategory(id, data.name);

};

const deleteCategory = async (id) => {

  return categoryRepository.deleteCategory(id);

};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};