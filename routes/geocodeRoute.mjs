import express from 'express';
import geocodePreviewService from "../services/geocodePreviewService.mjs";

const router = express.Router();

function q(req, name) {
  const v = req.query[name];
  return typeof v === 'string' ? v.trim() : '';
}

router.get('/preview', async (req, res) => {
  try {
    const address_line = q(req, 'address_line');
    const district = q(req, 'district');
    const subdistrict = q(req, 'subdistrict');
    const province = q(req, 'province');
    const postal_code = q(req, 'postal_code');

    if (!address_line && !province) {
      return res.status(400).json({ error: 'Provide address_line or province.' });
    }

    const coords = await geocodePreviewService.previewGeocode({
      address_line,
      district,
      subdistrict,
      province,
      postal_code,
    });

    if (!coords) {
      return res.status(200).json({ latitude: null, longitude: null });
    }
    res.status(200).json({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  } catch (err) {
    console.error('Geocode preview error:', err);
    res.status(500).json({ error: 'Geocode failed.' });
  }
});

export default router;
