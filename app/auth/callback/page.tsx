'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../../amplifyClient';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    ensureAmplifyConfigured();

    getCurrentUser()
      .then(() => router.replace('/app'))
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>
      <p>Completing sign-in…</p>
    </main>
  );
}