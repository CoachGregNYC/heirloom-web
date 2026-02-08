'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function complete() {
      try {
        await fetchAuthSession(); // Amplify finishes OAuth internally
        router.replace('/app');
      } catch (e) {
        console.error(e);
        router.replace('/login');
      }
    }
    complete();
  }, [router]);

  return (
    <main style={{ padding: 32 }}>
      <h1>Heirloom</h1>
      <p>Completing sign-in…</p>
    </main>
  );
}