'use client';

import { useCallback, useEffect, useState } from 'react';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';

export type MeProfile = {
  userSub: string;
  familyId?: string;
  role?: string;
  createdAt?: string;
};

export function useMe() {
  const [me, setMe] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      ensureAmplifyConfigured();
      const data = await apiFetch('/me', { method: 'GET' });
      setMe(data as MeProfile);
    } catch (e: any) {
      setMe(null);
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { me, loading, error, refresh };
}
