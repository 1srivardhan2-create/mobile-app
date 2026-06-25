import type { Cafe } from '../types';

export function getCafeImages(cafe: Cafe): string[] {
  const fromCloud = cafe.cloudinaryImages?.filter(isHttpUrl) ?? [];
  if (fromCloud.length) return fromCloud;
  const photos = cafe.Cafe_photos?.filter(isHttpUrl) ?? [];
  if (photos.length) return photos;
  if (cafe.profilePicture && isHttpUrl(cafe.profilePicture)) return [cafe.profilePicture];
  return [];
}

function isHttpUrl(url?: string): url is string {
  return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')));
}

export function getCafeCover(cafe: Cafe): string | undefined {
  return getCafeImages(cafe)[0];
}
