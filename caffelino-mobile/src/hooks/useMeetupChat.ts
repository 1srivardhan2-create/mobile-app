import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { meetupsApi } from '../api';
import { SOCKET_URL } from '../config/env';
import type { Meetup, MeetupMessage } from '../types';

export interface ChatMessage extends MeetupMessage {
  replyTo?: { userName: string; message: string };
  reactions?: Record<string, string[]>;
  imageUrl?: string;
  pending?: boolean;
}

function parseMessage(raw: MeetupMessage): ChatMessage {
  const msg = raw.message ?? '';
  let replyTo: ChatMessage['replyTo'];
  let imageUrl: string | undefined;
  let text = msg;

  const replyMatch = msg.match(/^\[reply:([^|]+)\|([^\]]+)\]\s*(.*)$/s);
  if (replyMatch) {
    replyTo = { userName: replyMatch[1], message: replyMatch[2] };
    text = replyMatch[3];
  }

  const imgMatch = msg.match(/^\[image:(.+)\]$/);
  if (imgMatch) {
    imageUrl = imgMatch[1];
    text = '';
  }

  return {
    ...raw,
    message: text,
    replyTo,
    imageUrl,
    billData: raw.billData,
  };
}

function serializeMessage(text: string, replyTo?: ChatMessage['replyTo'], imageUrl?: string) {
  if (imageUrl) return `[image:${imageUrl}]`;
  if (replyTo) return `[reply:${replyTo.userName}|${replyTo.message}] ${text}`;
  return text;
}

export function useMeetupChat(meetupId: string, userId: string, userName: string, avatarId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await meetupsApi.getMessages(meetupId);
      setMessages((res.messages ?? []).map(parseMessage));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [meetupId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join_meetup_room', meetupId);

    socket.on('receive_message', (data: MeetupMessage & { _id?: string }) => {
      if (String(data.meetupId) !== String(meetupId)) return;
      const parsed = parseMessage(data as MeetupMessage);
      setMessages((prev) => {
        if (parsed._id && prev.some((m) => m._id === parsed._id)) return prev;
        return [...prev, parsed];
      });
    });

    socket.on('typing', (data: { meetupId: string; userName: string; userId: string }) => {
      if (data.meetupId !== meetupId || data.userId === userId) return;
      setTypingUsers((prev) => (prev.includes(data.userName) ? prev : [...prev, data.userName]));
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((n) => n !== data.userName));
      }, 3000);
    });

    socket.on('presence', (data: { meetupId: string; userId: string; status: 'online' | 'offline' }) => {
      if (data.meetupId !== meetupId) return;
      setOnlineUsers((prev) => {
        if (data.status === 'online') return prev.includes(data.userId) ? prev : [...prev, data.userId];
        return prev.filter((id) => id !== data.userId);
      });
    });

    // Listen for new users asking who is online
    socket.on('request_presence', () => {
      socket.emit('presence', { meetupId, userId, status: 'online' });
    });

    socket.on('member_joined', () => {
      loadMessages();
      socket.emit('presence', { meetupId, userId, status: 'online' });
    });
    socket.on('member_left', () => loadMessages());

    // Let others know we joined, and ask who is already here
    socket.emit('presence', { meetupId, userId, status: 'online' });
    socket.emit('request_presence', meetupId);

    return () => {
      socket.emit('presence', { meetupId, userId, status: 'offline' });
      socket.emit('leave_meetup_room', meetupId);
      socket.disconnect();
    };
  }, [meetupId, userId, loadMessages]);

  const emitTyping = useCallback(() => {
    socketRef.current?.emit('typing', { meetupId, userId, userName });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  }, [meetupId, userId, userName]);

  const sendMessage = useCallback(
    async (text: string, replyTo?: ChatMessage['replyTo'], imageUrl?: string) => {
      const serialized = serializeMessage(text.trim(), replyTo, imageUrl);
      if (!serialized) return;

      const optimistic: ChatMessage = {
        _id: `temp-${Date.now()}`,
        meetupId,
        userId,
        userName,
        avatarId,
        message: text.trim(),
        type: 'user',
        createdAt: new Date().toISOString(),
        replyTo,
        imageUrl,
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await meetupsApi.sendMessage({
          meetupId,
          userId,
          userName,
          avatarId,
          message: serialized,
        });
        const saved = parseMessage(res.message);
        setMessages((prev) =>
          prev.map((m) => (m._id === optimistic._id ? saved : m)),
        );
        socketRef.current?.emit('send_message', { ...saved, meetupId });
      } catch {
        setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      }
    },
    [meetupId, userId, userName, avatarId],
  );

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id !== messageId) return m;
        const reactions = { ...(m.reactions ?? {}) };
        const list = reactions[emoji] ?? [];
        if (list.includes(userId)) {
          reactions[emoji] = list.filter((id) => id !== userId);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...list, userId];
        }
        return { ...m, reactions };
      }),
    );
  }, [userId]);

  return {
    messages,
    loading,
    typingUsers,
    onlineUsers,
    sendMessage,
    addReaction,
    emitTyping,
    reload: loadMessages,
  };
}

export function useMeetupRoom(meetupId: string) {
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await meetupsApi.getById(meetupId);
      setMeetup(res.meetup);
    } catch {
      setMeetup(null);
    } finally {
      setLoading(false);
    }
  }, [meetupId]);

  useEffect(() => {
    load();
  }, [load]);

  return { meetup, loading, reload: load };
}
