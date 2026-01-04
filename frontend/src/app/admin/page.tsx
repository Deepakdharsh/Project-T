'use client';

import { useEffect, useState } from 'react';
import { App, type AppView } from "@/components/App";
import { api, getApiConfig } from '@/lib/api';

export default function AdminPage() {
    const { baseUrl } = getApiConfig();
    const [ready, setReady] = useState(false);
    const [initialView, setInitialView] = useState<AppView>('admin-login');
    const [initialAdminToken, setInitialAdminToken] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const t = window.localStorage.getItem('adminToken');
            if (t) {
                setInitialAdminToken(t);
                setInitialView('admin-dashboard');
                setReady(true);
                return;
            }

            // No access token in storage — try refresh cookie flow
            try {
                const res = await api.refresh(baseUrl);
                if (res.user.role === 'admin') {
                    window.localStorage.setItem('adminToken', res.accessToken);
                    setInitialAdminToken(res.accessToken);
                    setInitialView('admin-dashboard');
                }
            } catch {
                // ignore
            } finally {
                setReady(true);
            }
        })();
    }, []);

    if (!ready) return null;
    return <App initialView={initialView} initialAdminToken={initialAdminToken} showNavbar={false} />;
}


