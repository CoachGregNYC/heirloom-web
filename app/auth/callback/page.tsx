'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../../amplifyClient';

export default function CallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Exchanging auth code for tokens…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        ensureAmplifyConfigured();

        // This is what triggers the Hosted UI "code" exchange in v6
        await fetchAuthSession();

        // Extra validation: should succeed if tokens are now stored
        await getCurrentUser();

        if (!cancelled) router.replace('/app');
      } catch (err: any) {
        console.error('[auth/callback] failed:', err);
        if (!cancelled) {
          setMsg(`Sign-in failed: ${err?.message ?? 'Unknown error'}`);
          // If you want: router.replace('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>{msg}</p>
    </main>
  );
}