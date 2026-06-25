/** Illustrated avatar options — maps to backend avatarId field */
export type HairStyle = 'short' | 'long' | 'curly' | 'bun' | 'waves';

export interface IllustratedAvatarOption {
  id: string;
  gender: 'male' | 'female';
  skinTone: string;
  hairColor: string;
  hairStyle: HairStyle;
  shirtColor: string;
  bgColor: string;
  accessory?: 'glasses' | 'earrings';
}

export const ILLUSTRATED_AVATARS: IllustratedAvatarOption[] = [
  // MALE AVATARS
  {
    id: 'male-illust-1',
    gender: 'male',
    skinTone: '#E8B796', // Light
    hairColor: '#2B1B17',
    hairStyle: 'short',
    shirtColor: '#6F4E37',
    bgColor: '#EDE0D4',
    accessory: 'glasses',
  },
  {
    id: 'male-illust-2',
    gender: 'male',
    skinTone: '#D4A574', // Medium
    hairColor: '#3E2723',
    hairStyle: 'curly',
    shirtColor: '#3E2723',
    bgColor: '#F0E4D8',
  },
  {
    id: 'male-illust-3',
    gender: 'male',
    skinTone: '#F1C9A9', // Fair
    hairColor: '#1A120B',
    hairStyle: 'waves',
    shirtColor: '#A67B5B',
    bgColor: '#E8DDD2',
  },
  {
    id: 'male-illust-4',
    gender: 'male',
    skinTone: '#C68B59', // Olive
    hairColor: '#111111',
    hairStyle: 'short',
    shirtColor: '#4A3B32',
    bgColor: '#D9C5B2',
  },
  {
    id: 'male-illust-5',
    gender: 'male',
    skinTone: '#8D5524', // Deep
    hairColor: '#000000',
    hairStyle: 'curly',
    shirtColor: '#8C6239',
    bgColor: '#E3D3C4',
    accessory: 'glasses',
  },
  {
    id: 'male-illust-6',
    gender: 'male',
    skinTone: '#EAC086', // Warm
    hairColor: '#5C3A21',
    hairStyle: 'waves',
    shirtColor: '#7A5B42',
    bgColor: '#F4E8DB',
  },

  // FEMALE AVATARS
  {
    id: 'female-illust-1',
    gender: 'female',
    skinTone: '#F1C9A9', // Fair
    hairColor: '#2B1B17',
    hairStyle: 'long',
    shirtColor: '#D4A373',
    bgColor: '#F5E6D3',
    accessory: 'earrings',
  },
  {
    id: 'female-illust-2',
    gender: 'female',
    skinTone: '#E8B796', // Light
    hairColor: '#6F4E37',
    hairStyle: 'bun',
    shirtColor: '#6F4E37',
    bgColor: '#EDE0D4',
  },
  {
    id: 'female-illust-3',
    gender: 'female',
    skinTone: '#D4A574', // Medium
    hairColor: '#1A120B',
    hairStyle: 'waves',
    shirtColor: '#A67B5B',
    bgColor: '#F0E4D8',
    accessory: 'earrings',
  },
  {
    id: 'female-illust-4',
    gender: 'female',
    skinTone: '#C68B59', // Olive
    hairColor: '#2A1B16',
    hairStyle: 'curly',
    shirtColor: '#5E4B3C',
    bgColor: '#DBCBB9',
  },
  {
    id: 'female-illust-5',
    gender: 'female',
    skinTone: '#8D5524', // Deep
    hairColor: '#000000',
    hairStyle: 'bun',
    shirtColor: '#9A714C',
    bgColor: '#E6D7C8',
    accessory: 'earrings',
  },
  {
    id: 'female-illust-6',
    gender: 'female',
    skinTone: '#F5D0B5', // Warm light
    hairColor: '#4A2E1B',
    hairStyle: 'long',
    shirtColor: '#8B6A50',
    bgColor: '#F2E5D5',
  },
];

const LEGACY_MAP: Record<string, string> = {
  'male-casual-1': 'male-illust-1',
  'male-casual-2': 'male-illust-2',
  'female-casual-1': 'female-illust-1',
  'female-casual-2': 'female-illust-2',
  'anime-hero-1': 'male-illust-3',
  'anime-hero-2': 'female-illust-3',
};

export function getAvatarById(id?: string): IllustratedAvatarOption {
  const resolved = id ? LEGACY_MAP[id] ?? id : ILLUSTRATED_AVATARS[0].id;
  return ILLUSTRATED_AVATARS.find((a) => a.id === resolved) ?? ILLUSTRATED_AVATARS[0];
}

export function getAvatarsByGender(gender: 'male' | 'female'): IllustratedAvatarOption[] {
  return ILLUSTRATED_AVATARS.filter((a) => a.gender === gender);
}

/** @deprecated use ILLUSTRATED_AVATARS */
export const ANIME_AVATARS = ILLUSTRATED_AVATARS;
