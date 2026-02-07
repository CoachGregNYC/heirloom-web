'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from './amplifyClient';

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<'working' | 'error'>('working');

  useEffect(() => {
    ensureAmplifyConfigured();

    (async () => {
      try {
        await getCurrentUser();
        router.replace('/app');
      } catch {
        router.replace('/login');
      }
    })().catch(() => setStatus('error'));
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>
      {status === 'working' && <p>Loading…</p>}
      {status === 'error' && <p>Could not determine session. Try refreshing.</p>}
    </main>
  );
}