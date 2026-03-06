import pool from "../utils/db.mjs";

const getAllServices = async () => {
  const query = `
    SELECT
      services.*,
      categories.name AS category_name
    FROM services
    LEFT JOIN categories
    ON services.category_id = categories.id
  `;

  const { rows } = await pool.query(query);
  return rows;
};

const getServiceById = async (id) => {
  const { rows } = await pool.query(
    "SELECT * FROM services WHERE id=$1",
    [id]
  );
  return rows[0];
};

const createService = async (data) => {

  const { name, description, category_id } = data;

  const { rows } = await pool.query(
    `
    INSERT INTO services (name, description, category_id)
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [name, description, category_id]
  );

  return rows[0];
};

const updateService = async (id, data) => {

  const { name, description, category_id } = data;

  const { rows } = await pool.query(
    `
    UPDATE services
    SET name=$1,
        description=$2,
        category_id=$3,
        updated_at=NOW()
    WHERE id=$4
    RETURNING *
    `,
    [name, description, category_id, id]
  );

  return rows[0];
};

const deleteService = async (id) => {

  await pool.query(
    "DELETE FROM services WHERE id=$1",
    [id]
  );

};

export default {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};