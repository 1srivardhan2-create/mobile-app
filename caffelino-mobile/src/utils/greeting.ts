export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

export function getGreetingPeriod(date = new Date()): GreetingPeriod {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening';
}

export function getGreetingLabel(period: GreetingPeriod): string {
  switch (period) {
    case 'morning':
      return 'Good Morning';
    case 'afternoon':
      return 'Good Afternoon';
    case 'evening':
      return 'Good Evening';
  }
}

export function getGreetingEmoji(period: GreetingPeriod): string {
  switch (period) {
    case 'morning':
      return '🌅';
    case 'afternoon':
      return '☀️';
    case 'evening':
      return '🌇';
  }
}

export function buildGreeting(firstName: string, date = new Date()): string {
  const period = getGreetingPeriod(date);
  const emoji = getGreetingEmoji(period);
  const label = getGreetingLabel(period);
  return `${emoji} ${label}, ${firstName} ☕`;
}
