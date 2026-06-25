import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { favoritesApi } from '../api/favorites.api';
import { cafesApi } from '../api/cafes.api';
import type { Cafe } from '../types';
import { useAuth } from './AuthContext';

const LOCAL_KEY = '@caffelino/favorite_ids';
const LOCAL_CAFES_KEY = '@caffelino/favorite_cafes';

type FavoritesContextValue = {
  lovedIds: Set<string>;
  lovedCafes: Cafe[];
  loading: boolean;
  isLoved: (cafeId: string) => boolean;
  toggle: (cafeId: string, cafe?: Cafe) => Promise<boolean>;
  refresh: () => Promise<void>;
  registerCafes: (cafes: Cafe[]) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function normalizeId(id: string) {
  return String(id);
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [lovedIds, setLovedIds] = useState<Set<string>>(new Set());
  const [lovedCafes, setLovedCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);
  const cafeCacheRef = useRef<Map<string, Cafe>>(new Map());

  const registerCafes = useCallback((cafes: Cafe[]) => {
    for (const c of cafes) {
      cafeCacheRef.current.set(normalizeId(c._id), c);
    }
  }, []);

  const resolveLovedList = useCallback(
    (ids: Set<string>, serverCafes: Cafe[]) => {
      const map = new Map<string, Cafe>();
      for (const c of serverCafes) map.set(normalizeId(c._id), c);
      for (const c of cafeCacheRef.current.values()) {
        if (ids.has(normalizeId(c._id))) map.set(normalizeId(c._id), c);
      }
      return [...ids]
        .map((id) => map.get(normalizeId(id)))
        .filter((c): c is Cafe => Boolean(c));
    },
    [],
  );

  const loadLocal = useCallback(async () => {
    try {
      const rawIds = await AsyncStorage.getItem(LOCAL_KEY);
      const rawCafes = await AsyncStorage.getItem(LOCAL_CAFES_KEY);
      if (rawIds) {
        const ids = new Set((JSON.parse(rawIds) as string[]).map(normalizeId));
        setLovedIds(ids);
        if (rawCafes) {
          const parsed: Cafe[] = JSON.parse(rawCafes);
          parsed.forEach((c) => cafeCacheRef.current.set(normalizeId(c._id), c));
          setLovedCafes(resolveLovedList(ids, parsed));
        }
      }
    } catch {
      /* ignore */
    }
  }, [resolveLovedList]);

  const saveLocal = useCallback(async (ids: Set<string>, cafes: Cafe[]) => {
    try {
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify([...ids]));
      await AsyncStorage.setItem(LOCAL_CAFES_KEY, JSON.stringify(cafes));
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      await loadLocal();
      return;
    }
    setLoading(true);
    try {
      const res = await favoritesApi.list();
      const ids = new Set(
        (res.cafeIds ?? res.favorites?.map((c) => normalizeId(c._id)) ?? []).map(normalizeId),
      );
      const favorites = res.favorites ?? [];
      favorites.forEach((c) => cafeCacheRef.current.set(normalizeId(c._id), c));
      setLovedIds(ids);
      const resolved = resolveLovedList(ids, favorites);
      setLovedCafes(resolved);
      await saveLocal(ids, resolved);
    } catch {
      await loadLocal();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadLocal, resolveLovedList, saveLocal]);

  useEffect(() => {
    refresh();
  }, [refresh, user?.id]);

  const isLoved = useCallback(
    (cafeId: string) => lovedIds.has(normalizeId(cafeId)),
    [lovedIds],
  );

  const toggle = useCallback(
    async (cafeId: string, cafe?: Cafe) => {
      const id = normalizeId(cafeId);
      const wasLoved = lovedIds.has(id);
      const nextIds = new Set(lovedIds);

      if (cafe) {
        cafeCacheRef.current.set(id, cafe);
      }

      if (wasLoved) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      setLovedIds(nextIds);

      let nextCafes: Cafe[];
      if (wasLoved) {
        nextCafes = lovedCafes.filter((c) => normalizeId(c._id) !== id);
      } else {
        const cached = cafe ?? cafeCacheRef.current.get(id);
        if (cached) {
          nextCafes = [cached, ...lovedCafes.filter((c) => normalizeId(c._id) !== id)];
        } else {
          try {
            const detail = await cafesApi.getById(id);
            const full = detail.cafe;
            cafeCacheRef.current.set(id, full);
            nextCafes = [full, ...lovedCafes.filter((c) => normalizeId(c._id) !== id)];
          } catch {
            nextCafes = resolveLovedList(nextIds, lovedCafes);
          }
        }
      }

      setLovedCafes(nextCafes);
      await saveLocal(nextIds, nextCafes);

      if (!isAuthenticated) {
        return !wasLoved;
      }

      try {
        const res = await favoritesApi.toggle(id);
        if (res.cafe) {
          cafeCacheRef.current.set(id, res.cafe);
        }
        const finalIds = new Set(nextIds);
        if (res.loved) finalIds.add(id);
        else finalIds.delete(id);
        setLovedIds(finalIds);
        const finalCafes = resolveLovedList(finalIds, nextCafes);
        setLovedCafes(finalCafes);
        await saveLocal(finalIds, finalCafes);
        return res.loved;
      } catch {
        return !wasLoved;
      }
    },
    [isAuthenticated, lovedIds, lovedCafes, resolveLovedList, saveLocal],
  );

  const lovedCafesResolved = useMemo(
    () => resolveLovedList(lovedIds, lovedCafes),
    [lovedIds, lovedCafes, resolveLovedList],
  );

  const value = useMemo(
    () => ({
      lovedIds,
      lovedCafes: lovedCafesResolved,
      loading,
      isLoved,
      toggle,
      refresh,
      registerCafes,
    }),
    [lovedIds, lovedCafesResolved, loading, isLoved, toggle, refresh, registerCafes],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
