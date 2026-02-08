'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function HomePage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Loading…');

  useEffect(() => {
    async function run() {
      try {
        // If Amplify auth session exists, go to the protected app area.
        const session = await fetchAuthSession();
        const hasTokens = !!session?.tokens?.accessToken && !!session?.tokens?.idToken;

        if (hasTokens) {
          router.replace('/app');
          return;
        }

        // No session -> login
        router.replace('/login');
      } catch (e) {
        // Any error -> treat as signed out
        setMsg('Redirecting to sign in…');
        router.replace('/login');
      }
    }

    run();
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>
      <p>{msg}</p>
    </main>
  );
}