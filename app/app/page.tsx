'use client';

import { useEffect, useState } from 'react';
import { signInWithRedirect } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../amplifyClient';

export default function LoginPage() {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Configure Amplify on mount (client only)
    try {
      ensureAmplifyConfigured();
    } catch (e) {
      console.error('[login] Amplify configure failed:', e);
    }
  }, []);

  async function onSignIn() {
    setBusy(true);
    try {
      ensureAmplifyConfigured();
      await signInWithRedirect();
    } catch (e) {
      console.error('[login] signInWithRedirect failed:', e);
      alert(String((e as any)?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 10 }}>Heirloom</h1>
      <p style={{ marginTop: 0 }}>Preserve what matters. Private, secure, family-first.</p>

      <button
        onClick={onSignIn}
        disabled={busy}
        style={{
          marginTop: 24,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid #111',
          background: '#111',
          color: '#fff',
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </main>
  );
}