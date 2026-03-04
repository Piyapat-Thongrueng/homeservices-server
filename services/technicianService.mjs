import pool from "../utils/db.mjs";

const technicianServices = {
  getTechnicianProfile: async (technicianId) => {
    // Query 1: get technician profile
    const profileResult = await pool.query(
      `
        SELECT u.id,
        u.first_name,
        u.last_name,
        u.phone,
        up.is_available,
        up.latitude,
        up.longitude,
        up.location_updated_at
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1 AND u.role = 'technician'
    `,
      [technicianId],
    );

    // if no technician found, return null
    if (profileResult.rows.length === 0) {
      return null;
    }
    const technicianData = profileResult.rows[0];

    // Query 2: ดึง services ทั้งหมด พร้อมบอกว่าช่างคนนี้รับได้มั้ย
    // LEFT JOIN technician_services → ถ้าไม่มี record → is_selected = false
    // CASE WHEN → แปลง NULL/NOT NULL เป็น true/false
    const servicesResult = await pool.query(
      `SELECT 
        s.id, 
        s.name, 
        CASE 
            WHEN ts.technician_id IS NOT NULL THEN true 
            ELSE false 
        END AS is_selected
        FROM services s
        LEFT JOIN technician_services ts 
        ON s.id = ts.service_id AND ts.technician_id = $1 
        ORDER BY s.id
        `,
      [technicianId],
    );

    // Combine the results into a single object
    return {
        ...technicianData,
        services: servicesResult.rows,
    }
  },
};
