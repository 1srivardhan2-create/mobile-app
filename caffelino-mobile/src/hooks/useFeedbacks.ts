import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { feedbackApi } from '../api';
import { SOCKET_URL } from '../config/env';
import type { Feedback } from '../types';

export function useFeedbacks(userId?: string) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackApi.getAll(userId);
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socket.on('new_global_feedback', (item: Feedback) => {
        setFeedbacks((prev) => [item, ...prev]);
      });
    } catch {
      // Socket optional when offline
    }
    return () => {
      socket?.disconnect();
    };
  }, []);

  return { feedbacks, loading, error, refetch: load, setFeedbacks };
}
