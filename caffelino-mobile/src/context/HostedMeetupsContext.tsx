import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { meetupsApi } from '../api/meetups.api';
import type { Meetup } from '../types';
import { useAuth } from './AuthContext';
import { getMeetupDisplayStatus } from '../utils/meetupDisplay';

const LOCAL_KEY = '@caffelino/hosted_meetups';
const DELETED_KEY = '@caffelino/deleted_meetups';

type HostedMeetupsContextValue = {
  meetups: Meetup[];
  loading: boolean;
  activeCount: number;
  totalCount: number;
  refresh: () => Promise<void>;
  registerMeetup: (meetup: Meetup) => Promise<void>;
  deleteMeetup: (id: string) => Promise<void>;
};

const HostedMeetupsContext = createContext<HostedMeetupsContextValue | null>(null);

function mergeMeetups(server: Meetup[], local: Meetup[], deletedIds: string[]): Meetup[] {
  const map = new Map<string, Meetup>();
  for (const m of local) map.set(String(m._id), m);
  for (const m of server) map.set(String(m._id), m);
  return [...map.values()]
    .filter((m) => !deletedIds.includes(String(m._id)))
    .sort(
      (a, b) =>
        new Date((b as Meetup & { createdAt?: string }).createdAt ?? 0).getTime() -
        new Date((a as Meetup & { createdAt?: string }).createdAt ?? 0).getTime(),
    );
}

export function HostedMeetupsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);

  const saveLocal = useCallback(async (list: Meetup[]) => {
    try {
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }, []);

  const loadLocal = useCallback(async (): Promise<Meetup[]> => {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Meetup[];
      if (!user?.id) return parsed;
      return parsed.filter((m) => String(m.organizerId) === String(user.id));
    } catch {
      return [];
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setMeetups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const local = await loadLocal();
    let deletedIds: string[] = [];
    try {
      const deletedRaw = await AsyncStorage.getItem(DELETED_KEY);
      if (deletedRaw) deletedIds = JSON.parse(deletedRaw);
    } catch {}

    try {
      const res = await meetupsApi.getHosted(user.id);
      const merged = mergeMeetups(res.meetups ?? [], local, deletedIds);
      setMeetups(merged);
      await saveLocal(merged);
    } catch {
      setMeetups(mergeMeetups([], local, deletedIds));
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadLocal, saveLocal]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const registerMeetup = useCallback(
    async (meetup: Meetup) => {
      setMeetups((prev) => {
        const next = [meetup, ...prev.filter((m) => String(m._id) !== String(meetup._id))];
        saveLocal(next);
        return next;
      });
    },
    [saveLocal],
  );

  const deleteMeetup = useCallback(
    async (id: string) => {
      try {
        let deletedIds: string[] = [];
        const deletedRaw = await AsyncStorage.getItem(DELETED_KEY);
        if (deletedRaw) deletedIds = JSON.parse(deletedRaw);
        deletedIds.push(id);
        await AsyncStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
        
        setMeetups((prev) => {
          const next = prev.filter((m) => String(m._id) !== id);
          saveLocal(next);
          return next;
        });
      } catch (err) {
        console.error('Failed to soft delete meetup', err);
      }
    },
    [saveLocal],
  );

  const activeCount = useMemo(
    () => meetups.filter((m) => getMeetupDisplayStatus(m) !== 'ended').length,
    [meetups],
  );

  const value = useMemo(
    () => ({
      meetups,
      loading,
      activeCount,
      totalCount: meetups.length,
      refresh,
      registerMeetup,
      deleteMeetup,
    }),
    [meetups, loading, activeCount, refresh, registerMeetup, deleteMeetup],
  );

  return (
    <HostedMeetupsContext.Provider value={value}>{children}</HostedMeetupsContext.Provider>
  );
}

export function useHostedMeetups() {
  const ctx = useContext(HostedMeetupsContext);
  if (!ctx) throw new Error('useHostedMeetups must be used within HostedMeetupsProvider');
  return ctx;
}
