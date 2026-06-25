import type { Cafe } from '../types';

type CafeLocationFields = Pick<
  Cafe,
  'Name' | 'Cafe_Address' | 'latitude' | 'longitude' | 'coordinates'
>;

/** Valid non-zero coordinates from DB */
export function getCafeCoordinates(
  cafe: CafeLocationFields,
): { lat: number; lng: number } | null {
  const lat = cafe.coordinates?.lat ?? cafe.latitude;
  const lng = cafe.coordinates?.lng ?? cafe.longitude;

  if (lat == null || lng == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
}

/**
 * Opens Google Maps at the exact cafe pin (place view, not turn-by-turn navigation).
 *
 * Priority 1: latitude + longitude
 * Priority 2: "Cafe Name, Full Address"
 */
export function buildGoogleMapsCafeUrl(cafe: CafeLocationFields): string | null {
  const coords = getCafeCoordinates(cafe);
  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  }

  const name = cafe.Name?.trim();
  const address = cafe.Cafe_Address?.trim();

  if (name && address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  if (name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  }

  return null;
}

/** @deprecated use buildGoogleMapsCafeUrl */
export const buildGoogleMapsCafeSearchUrl = buildGoogleMapsCafeUrl;
