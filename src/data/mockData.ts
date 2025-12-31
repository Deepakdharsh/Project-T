export const INITIAL_CATEGORIES = [
  { id: 'c1', name: 'Football' },
  { id: 'c2', name: 'Cricket' }
];

export const INITIAL_GAMES = [
  { id: 'g1', categoryId: 'c1', name: '5v5 Football' },
  { id: 'g2', categoryId: 'c1', name: '7v7 Football' },
  { id: 'g3', categoryId: 'c2', name: 'Box Cricket' }
];

export const INITIAL_SLOTS = [
  { id: 1, gameId: 'g1', time: '18:00 - 19:00', startHour: 18, price: 60, active: true },
  { id: 2, gameId: 'g1', time: '19:00 - 20:00', startHour: 19, price: 60, active: true },
  { id: 3, gameId: 'g2', time: '18:00 - 19:00', startHour: 18, price: 90, active: true },
  { id: 4, gameId: 'g2', time: '19:00 - 20:00', startHour: 19, price: 90, active: true },
  { id: 5, gameId: 'g3', time: '18:00 - 19:00', startHour: 18, price: 50, active: true },
];

import type { Booking } from '@/types';

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_CLOSURES = [
  {
    id: 'CL-1',
    type: 'partial', 
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
    startHour: 18,
    endHour: 20,
    reason: 'Maintenance',
    note: 'Pitch resurfacing'
  }
];

