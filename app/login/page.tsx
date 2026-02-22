'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, signInWithRedirect } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../amplifyClient';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        ensureAmplifyConfigured();

        // Only redirect if we truly have tokens (not just a cached "current user")
        const session = await fetchAuthSession();
        const hasTokens =
          !!session?.tokens?.accessToken || !!session?.tokens?.idToken;

        if (hasTokens) {
          router.replace('/app');
        }
      } catch {
        // Not signed in — stay on /login
      }
    })();
  }, [router]);

  const onSignIn = async () => {
    try {
      ensureAmplifyConfigured();
      await signInWithRedirect();
    } catch (e) {
      console.error('[login] signInWithRedirect failed:', e);
      alert(String((e as any)?.message ?? e));
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
    </main>
  );
}