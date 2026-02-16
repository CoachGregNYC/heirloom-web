'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../../amplifyClient';

export default function CallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Completing sign-in...');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        ensureAmplifyConfigured();

        setMsg('Exchanging auth code for tokens (fetchAuthSession)...');
        await fetchAuthSession();

        // Verify we actually have a user now
        await getCurrentUser();

        if (!cancelled) router.replace('/app');
      } catch (err) {
        console.error('[auth/callback] failed:', err);
        if (!cancelled) router.replace('/auth/error');
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
