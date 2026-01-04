import { api, getApiConfig } from '@/lib/api';

let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAdminAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { baseUrl } = getApiConfig();
    try {
      const res = await api.refresh(baseUrl);
      if (res.user.role !== 'admin') return null;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('adminToken', res.accessToken);
      }
      return res.accessToken;
    } catch {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('adminToken');
      }
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}


