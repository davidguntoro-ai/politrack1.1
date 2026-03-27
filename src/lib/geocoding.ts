export interface GeoAddress {
  display: string;
  road: string;
  village: string;
  district: string;
  city: string;
  province: string;
  raw: string;
}

export async function getAddressFromCoords(lat: number, lon: number): Promise<GeoAddress> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=id`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PoliTrackAI/1.0 (campaign-management)' },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  const a = data.address || {};

  const road      = a.road || a.footway || a.pedestrian || '';
  const village   = a.village || a.suburb || a.neighbourhood || a.hamlet || '';
  const district  = a.county || a.district || a.city_district || '';
  const city      = a.city || a.town || a.municipality || '';
  const province  = a.state || '';

  const parts = [road, village, district, city, province].filter(Boolean);
  const display = parts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  return { display, road, village, district, city, province, raw: data.display_name || '' };
}
