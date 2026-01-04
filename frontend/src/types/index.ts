export interface Category {
  id: string;
  name: string;
}

export interface Game {
  id: string;
  categoryId: string;
  name: string;
}

export interface Slot {
  id: string;
  gameId: string;
  time: string;
  startHour: number;
  endHour?: number;
  price: number;
  active: boolean;
}

export interface Booking {
  id: string;
  date: string;
  slots: string[];
  totalPrice: number;
  gameId: string;
  gameName: string;
  status: 'Confirmed' | 'Checked In' | 'Cancelled';
  user?: string;
  checkedInAt?: string | null;
  scanToken?: string;
}

export interface Closure {
  id: string;
  type: 'full' | 'partial';
  date: string;
  startHour?: number;
  endHour?: number;
  reason: string;
  note?: string;
}

export interface BookingDetails {
  date: string;
  slots: Slot[];
  total: number;
  gameName: string;
  gameId: string;
}

