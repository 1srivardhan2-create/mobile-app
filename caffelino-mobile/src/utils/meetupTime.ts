export interface DateOption {
  key: string;
  label: string;
  dayNum: number;
  monthShort: string;
  date: Date;
  iso: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
}

const OPEN_MINUTES = 10 * 60;
const CLOSE_MINUTES = 22 * 60;
const SLOT_DURATION = 30;

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatTime(minutes: number) {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${pad(m)} ${period}`;
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getUpcomingDates(count = 3): DateOption[] {
  const labels = ['TODAY', 'TOMORROW'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const monthShort = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    let label = labels[i] ?? 'NEXT DAY';
    if (i === 2) label = 'NEXT DAY';

    return {
      key: toIsoDate(date),
      label,
      dayNum: date.getDate(),
      monthShort,
      date,
      iso: toIsoDate(date),
    };
  });
}

export function generateTimeSlots(selectedDate: Date, now = new Date()): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const isToday = toIsoDate(selectedDate) === toIsoDate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let start = OPEN_MINUTES; start + SLOT_DURATION <= CLOSE_MINUTES; start += SLOT_DURATION) {
    if (isToday && start <= nowMinutes) continue;

    const end = start + SLOT_DURATION;
    slots.push({
      id: `${start}-${end}`,
      label: `${formatTime(start)} - ${formatTime(end)}`,
      startMinutes: start,
      endMinutes: end,
    });
  }

  return slots;
}

export function formatMeetupTime(slot: TimeSlot) {
  return slot.label;
}
