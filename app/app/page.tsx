'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../amplifyClient';

export default function AppPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    ensureAmplifyConfigured();

    getCurrentUser()
      .then((user) => setEmail(user.username ?? null))
      .catch(() => router.replace('/login'));
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!email) {
    return (
      <main style={{ padding: 32, fontFamily: 'system-ui' }}>
        <h1>Heirloom</h1>
        <p>Checking session…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>✅ Signed in as {email}</p>

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