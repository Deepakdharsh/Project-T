import type { Booking, Category, Closure, Game, Slot } from '@/types';

export type ApiConfig = {
  baseUrl: string; // e.g. http://localhost:8080/api/v1
};

export function getApiConfig(): ApiConfig {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
  return { baseUrl };
}

async function apiFetch<T>(
  baseUrl: string,
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const msg = body?.error?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export const api = {
  async catalog(baseUrl: string) {
    const [categoriesRes, gamesRes, slotsRes, closuresRes] = await Promise.all([
      apiFetch<{ categories: Category[] }>(baseUrl, '/catalog/categories'),
      apiFetch<{ games: Game[] }>(baseUrl, '/catalog/games'),
      apiFetch<{ slots: Slot[] }>(baseUrl, '/catalog/slots'),
      apiFetch<{ closures: Closure[] }>(baseUrl, '/catalog/closures'),
    ]);
    return {
      categories: categoriesRes.categories,
      games: gamesRes.games,
      slots: slotsRes.slots,
      closures: closuresRes.closures,
    };
  },

  async createBooking(
    baseUrl: string,
    input: { date: string; gameId: string; slotIds: string[]; guest?: { name: string; email?: string }; paymentMethod?: 'card' | 'gpay' }
  ) {
    return apiFetch<{ booking: Booking }>(baseUrl, '/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async contact(
    baseUrl: string,
    input: { name: string; email: string; subject: string; message: string }
  ) {
    return apiFetch<{ message: string; id: string; createdAt: string }>(baseUrl, '/contact', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async login(baseUrl: string, input: { email: string; password: string }) {
    return apiFetch<{ user: { id: string; email: string; name: string; role: 'user' | 'admin' }; accessToken: string }>(
      baseUrl,
      '/auth/login',
      { method: 'POST', body: JSON.stringify(input) }
    );
  },

  async refresh(baseUrl: string) {
    return apiFetch<{ user: { id: string; email: string; name: string; role: 'user' | 'admin' }; accessToken: string }>(
      baseUrl,
      '/auth/refresh',
      { method: 'POST' }
    );
  },

  async logout(baseUrl: string) {
    await fetch(`${baseUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
  },

  payments: {
    async createOrder(
      baseUrl: string,
      input:
        | { bookingId: string }
        | { date: string; gameId: string; slotIds: string[]; guest: { name: string; email: string } }
    ) {
      return apiFetch<{
        booking: Booking;
        razorpay: { keyId: string | undefined; orderId: string; amount: number; currency: string };
      }>(baseUrl, '/payments/create-order', { method: 'POST', body: JSON.stringify(input) });
    },
    async verify(baseUrl: string, input: { bookingId: string; orderId: string; paymentId: string; signature: string }) {
      return apiFetch<{
        booking: Booking;
        payment: {
          orderId: string;
          paymentId?: string;
          amount: number;
          currency: string;
          paymentMethod?: string;
          paymentStatus: string;
          refundedAmount: number;
          createdAt: string;
        };
      }>(baseUrl, '/payments/verify', { method: 'POST', body: JSON.stringify(input) });
    },
  },

  admin: {
    async listBookings(baseUrl: string, token: string) {
      return apiFetch<{ bookings: Booking[] }>(baseUrl, '/admin/bookings', { token });
    },
    async patchBookingStatus(baseUrl: string, token: string, bookingId: string, status: Booking['status']) {
      return apiFetch<{ booking: { id: string; status: Booking['status']; checkedInAt: string | null } }>(
        baseUrl,
        `/admin/bookings/${encodeURIComponent(bookingId)}/status`,
        { method: 'PATCH', token, body: JSON.stringify({ status }) }
      );
    },
    async checkIn(baseUrl: string, token: string, bookingId: string) {
      return apiFetch<{ booking: { id: string; status: Booking['status']; checkedInAt: string | null } }>(
        baseUrl,
        `/admin/bookings/${encodeURIComponent(bookingId)}/checkin`,
        { method: 'POST', token }
      );
    },
    async deleteBooking(baseUrl: string, token: string, bookingId: string) {
      const res = await fetch(`${baseUrl}/admin/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error(`Failed to delete booking (${res.status})`);
    },
    async patchSlot(baseUrl: string, token: string, slotId: string, patch: { price?: number; active?: boolean }) {
      return apiFetch<{ slot: Slot }>(baseUrl, `/admin/slots/${encodeURIComponent(slotId)}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(patch),
      });
    },
    async deleteSlot(baseUrl: string, token: string, slotId: string) {
      const res = await fetch(`${baseUrl}/admin/slots/${encodeURIComponent(slotId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error(`Failed to delete slot (${res.status})`);
    },
    async removeAllSlots(baseUrl: string, token: string, gameId: string) {
      return apiFetch<{ deletedCount: number }>(baseUrl, `/admin/slots?gameId=${encodeURIComponent(gameId)}`, {
        method: 'DELETE',
        token,
      });
    },
    async generateSlots(
      baseUrl: string,
      token: string,
      body: {
        gameId: string;
        openHour: number;
        closeHour: number;
        durationMins: '60' | '120';
        dayPrice: number;
        peakPrice: number;
        peakStartHour: number;
        replaceExisting: boolean;
      }
    ) {
      return apiFetch<{ slots: Slot[] }>(baseUrl, '/admin/slots/generate', { method: 'POST', token, body: JSON.stringify(body) });
    },
    async createSlot(
      baseUrl: string,
      token: string,
      body: { gameId: string; startHour: number; endHour: number; price: number; active?: boolean }
    ) {
      return apiFetch<{ slot: Slot }>(baseUrl, '/admin/slots', { method: 'POST', token, body: JSON.stringify(body) });
    },
    async listClosures(baseUrl: string, token: string) {
      return apiFetch<{ closures: Closure[] }>(baseUrl, '/admin/closures', { token });
    },
    async createClosure(baseUrl: string, token: string, body: Omit<Closure, 'id'>) {
      return apiFetch<{ closure: Closure }>(baseUrl, '/admin/closures', { method: 'POST', token, body: JSON.stringify(body) });
    },
    async deleteClosure(baseUrl: string, token: string, closureId: string) {
      const res = await fetch(`${baseUrl}/admin/closures/${encodeURIComponent(closureId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error(`Failed to delete closure (${res.status})`);
    },
    async verifyScan(baseUrl: string, token: string, scanToken: string) {
      return apiFetch<{ status: 'VALID' | 'INVALID' | 'EXPIRED' | 'ALREADY_USED'; booking?: Booking }>(
        baseUrl,
        '/admin/scans/verify',
        { method: 'POST', token, body: JSON.stringify({ token: scanToken }) }
      );
    },

    // -----------------------------
    // Catalog (Categories / Games)
    // -----------------------------
    async listCategories(baseUrl: string, token: string) {
      return apiFetch<{ categories: Category[] }>(baseUrl, '/admin/catalog/categories', { token });
    },
    async createCategory(baseUrl: string, token: string, body: { name: string }) {
      return apiFetch<{ category: Category }>(baseUrl, '/admin/catalog/categories', { method: 'POST', token, body: JSON.stringify(body) });
    },
    async updateCategory(baseUrl: string, token: string, categoryId: string, body: { name?: string }) {
      return apiFetch<{ category: Category }>(baseUrl, `/admin/catalog/categories/${encodeURIComponent(categoryId)}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      });
    },
    async deleteCategory(baseUrl: string, token: string, categoryId: string) {
      const res = await fetch(`${baseUrl}/admin/catalog/categories/${encodeURIComponent(categoryId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `Failed to delete category (${res.status})`);
      }
    },
    async listGames(baseUrl: string, token: string) {
      return apiFetch<{ games: Game[] }>(baseUrl, '/admin/catalog/games', { token });
    },
    async createGame(baseUrl: string, token: string, body: { categoryId: string; name: string }) {
      return apiFetch<{ game: Game }>(baseUrl, '/admin/catalog/games', { method: 'POST', token, body: JSON.stringify(body) });
    },
    async updateGame(baseUrl: string, token: string, gameId: string, body: { categoryId?: string; name?: string }) {
      return apiFetch<{ game: Game }>(baseUrl, `/admin/catalog/games/${encodeURIComponent(gameId)}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      });
    },
    async deleteGame(baseUrl: string, token: string, gameId: string) {
      const res = await fetch(`${baseUrl}/admin/catalog/games/${encodeURIComponent(gameId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `Failed to delete game (${res.status})`);
      }
    },
  },
};


