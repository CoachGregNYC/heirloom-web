'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from './amplifyClient';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    ensureAmplifyConfigured();

    // If signed in → go to /app, else → /login
    getCurrentUser()
      .then(() => router.replace('/app'))
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>Loading…</p>
    </main>
  );
}