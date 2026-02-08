'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function jwtPayload(token: string): any | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function AppPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const idToken = localStorage.getItem('heirloom_id_token');
    const accessToken = localStorage.getItem('heirloom_access_token');

    if (!idToken || !accessToken) {
      router.replace('/login');
      return;
    }

    const payload = jwtPayload(idToken);
    setEmail(payload?.email ?? payload?.cognito_username ?? null);
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('heirloom_id_token');
    localStorage.removeItem('heirloom_access_token');
    localStorage.removeItem('heirloom_refresh_token');
    localStorage.removeItem('heirloom_expires_in');
    router.replace('/login');
  };

  if (!localStorage.getItem('heirloom_id_token')) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Heirloom</h1>
        <p>Checking session…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>✅ Signed in{email ? ` as ${email}` : ''}</p>

      <button
        onClick={handleSignOut}
        style={{
          marginTop: 12,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #111',
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>

      <hr style={{ margin: '24px 0' }} />

      <h2>Family Filing Cabinet</h2>
      <p>Authenticated area — next step is wiring S3 with Cognito Identity.</p>
    </main>
  );
}