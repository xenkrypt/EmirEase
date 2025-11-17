import type { Language } from './types';

export const languages: Language[] = [
  { code: 'ar', name: 'Arabic' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'ur', name: 'Urdu' },
];

export const FILE_SIZE_LIMIT_MB = 5;
export const EXPIRATION_THRESHOLD_DAYS = 60;
