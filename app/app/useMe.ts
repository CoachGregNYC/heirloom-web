// app/app/useMe.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/app/apiClient';

export type MeResponse = {
  userSub: string;
  familyId?: string;
  role?: string;
  createdAt?: string;
};

export function useMe() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/me', { method: 'GET' });
      setMe(data ?? null);
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

  return { me, familyId: me?.familyId ?? '', role: me?.role ?? '', loading, error, refresh };
}