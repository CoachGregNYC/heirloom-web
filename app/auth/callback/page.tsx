'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';
import { ensureAmplifyConfigured } from '../../amplifyClient';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    ensureAmplifyConfigured();

    const unsub = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signIn') {
        router.replace('/app');
      }
      if (payload.event === 'signIn_failure') {
        router.replace('/login');
      }
    });

    return () => unsub();
  }, [router]);

  return (
    <main style={{ padding: 32 }}>
      <h1>Heirloom</h1>
      <p>Completing sign-in…</p>
    </main>
  );
}