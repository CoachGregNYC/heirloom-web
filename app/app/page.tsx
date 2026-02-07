'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../amplifyClient';

export default function AppPage() {
  const router = useRouter();

  const [status, setStatus] = useState<'checking' | 'signedIn'>('checking');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    ensureAmplifyConfigured();

    (async () => {
      try {
        const user = await getCurrentUser();
        setStatus('signedIn');

        // Cognito username is often email if you used email as username
        setEmail(user?.username ?? '');
      } catch {
        router.replace('/login');
      }
    })();
  }, [router]);

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      router.replace('/login');
    }
  }

  if (status === 'checking') {
    return (
      <main style={{ padding: 32, fontFamily: 'system-ui' }}>
        <h1 style={{ marginBottom: 8 }}>Heirloom</h1>
        <p>Checking session…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>

      <p style={{ marginTop: 0 }}>
        ✅ Signed in{email ? ` as ${email}` : ''}.
      </p>

      <button
        onClick={handleSignOut}
        style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid #111',
          background: '#fff',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Sign out
      </button>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          border: '1px solid #e5e5e5',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Next</h2>
        <p style={{ marginBottom: 0 }}>
          We’ll add the Family Filing Cabinet gallery + “Create Heirloom” form here next.
        </p>
      </div>
    </main>
  );
}