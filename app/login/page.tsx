'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithRedirect, getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../amplifyClient';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    ensureAmplifyConfigured();

    // If already signed in, skip login
    getCurrentUser()
      .then(() => router.replace('/app'))
      .catch(() => {
        /* not signed in — stay on login */
      });
  }, [router]);

  const onSignIn = async () => {
    setError('');
    ensureAmplifyConfigured();

    try {
      console.log('[Login] signIn clicked, calling signInWithRedirect()...');
      await signInWithRedirect();
      console.log('[Login] signInWithRedirect() returned (it usually redirects before this).');
    } catch (e: any) {
      console.error('[Login] signInWithRedirect failed:', e);
      setError(e?.message ?? String(e) ?? 'Unknown sign-in error');
      alert(`Sign-in failed: ${e?.message ?? e}`);
    }
  };

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>Preserve what matters. Private, secure, family-first.</p>

      <button
        onClick={onSignIn}
        style={{
          marginTop: 24,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid #111',
          background: '#111',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Sign in
      </button>

      {error ? (
        <p style={{ marginTop: 16, color: '#b00020' }}>
          <strong>Error:</strong> {error}
        </p>
      ) : null}
    </main>
  );
}