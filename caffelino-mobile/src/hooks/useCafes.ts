import { useCallback, useEffect, useState } from 'react';
import { cafesApi } from '../api';
import { useFavorites } from '../context/FavoritesContext';
import type { Cafe } from '../types';

export function useCafes() {
  const { registerCafes } = useFavorites();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cafesApi.getApproved();
      setCafes(res.cafes ?? []);
    } catch (e) {
      setError((e as Error).message);
      setCafes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (cafes.length) registerCafes(cafes);
  }, [cafes, registerCafes]);

  return { cafes, loading, error, refetch: load };
}

export function sortByDistance(
  cafes: Cafe[],
  userLat?: number,
  userLng?: number,
): Cafe[] {
  if (userLat == null || userLng == null) return cafes;

  const withDist = cafes.map((c) => {
    const lat = c.latitude ?? 0;
    const lng = c.longitude ?? 0;
    const d = Math.hypot(lat - userLat, lng - userLng);
    return { cafe: c, d };
  });

  return withDist.sort((a, b) => a.d - b.d).map((x) => x.cafe);
}
