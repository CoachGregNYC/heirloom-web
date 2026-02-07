'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAmplifyConfigured } from '../amplifyClient';
import { fetchAuthSession, signInWithRedirect } from 'aws-amplify/auth';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        ensureAmplifyConfigured();
        const session = await fetchAuthSession();
        if (session?.tokens?.accessToken && session?.tokens?.idToken) {
          router.replace('/app');
          return;
        }
      } catch {
        // not signed in (expected)
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [router]);

  const onSignIn = async () => {
    try {
      ensureAmplifyConfigured();
      await signInWithRedirect(); // uses oauth config from aws-exports.js
    } catch (e: any) {
      alert(e?.message ?? 'Failed to start sign-in redirect.');
    }
  };

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 6 }}>Heirloom</h1>
      <p style={{ marginTop: 0, color: '#444' }}>Preserve what matters. Private, secure, family-first.</p>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Sign in</h2>

        {checking ? (
          <p>Checking session…</p>
        ) : (
          <button
            onClick={onSignIn}
            style={{
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
        )}
      </div>
    </main>
  );
}