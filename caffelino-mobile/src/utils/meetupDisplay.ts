import type { Meetup } from '../types';

export type MeetupDisplayStatus = 'active' | 'upcoming' | 'ended';

export function getCafeNameFromMeetup(meetup: Meetup): string {
  const sc = meetup.selectedCafe;
  if (!sc) return 'Café TBD';
  if (typeof sc === 'string') return sc;
  return sc.cafeName || sc.name || 'Café TBD';
}

export function parseMeetupDateTime(date?: string, time?: string): Date | null {
  if (!date) return null;
  try {
    const timePart = time?.split('-')[0]?.trim() ?? '12:00 PM';
    const combined = `${date} ${timePart}`;
    const parsed = new Date(combined);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(`${date}T12:00:00`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  } catch {
    return null;
  }
}

export function getMeetupDisplayStatus(meetup: Meetup): MeetupDisplayStatus {
  if (meetup.status === 'completed') return 'ended';

  const scheduled = parseMeetupDateTime(meetup.date, meetup.time);
  const now = new Date();
  if (scheduled && scheduled.getTime() > now.getTime()) return 'upcoming';

  if (['active', 'voting', 'ordering'].includes(meetup.status)) return 'active';
  return 'ended';
}

export function formatMeetupDate(date?: string): string {
  if (!date) return 'Date TBD';
  try {
    const d = new Date(`${date}T12:00:00`);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

export function formatMeetupTimeDisplay(time?: string): string {
  if (!time) return 'Time TBD';
  return time.split('-')[0]?.trim() || time;
}

export const STATUS_BADGE = {
  active: { label: 'Active', emoji: '🟢', color: '#2E7D32' },
  upcoming: { label: 'Upcoming', emoji: '🟡', color: '#F9A825' },
  ended: { label: 'Ended', emoji: '🔴', color: '#C62828' },
} as const;
