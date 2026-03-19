import { geocodeAddress } from "../utils/geocode.mjs";

const previewGeocode = async ({
  address_line,
  district,
  subdistrict,
  province,
  postal_code,
}) => {
  return geocodeAddress({
    address_line: address_line || undefined,
    district: district || undefined,
    subdistrict: subdistrict || undefined,
    province: province || undefined,
    postal_code: postal_code || undefined,
  });
};

export default { previewGeocode };

