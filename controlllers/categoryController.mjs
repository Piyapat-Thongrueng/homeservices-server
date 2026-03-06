import categoryService from "../services/categoryService.mjs";

const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCategory = async (req, res) => {
  try {

    const category = await categoryService.getCategoryById(
      req.params.id
    );

    res.json(category);

  } catch (err) {

    res.status(404).json({ error: err.message });

  }
};

const createCategory = async (req, res) => {

  try {

    const category = await categoryService.createCategory(
      req.body
    );

    res.status(201).json(category);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

};

const updateCategory = async (req, res) => {

  try {

    const category = await categoryService.updateCategory(
      req.params.id,
      req.body
    );

    res.json(category);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

};

const deleteCategory = async (req, res) => {

  try {

    await categoryService.deleteCategory(
      req.params.id
    );

    res.json({
      message: "Category deleted successfully"
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

};

export default {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};