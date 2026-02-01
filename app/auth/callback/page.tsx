'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    // Call our server-side API route
    fetch(`/api/auth/callback?code=${code}`).then(() => {
      window.location.href = '/';
    });
  }, [searchParams]);

  return (
    <main style={{ padding: 32 }}>
      <h2>Signing you in…</h2>
      <p>Completing secure authentication.</p>
    </main>
  );
}