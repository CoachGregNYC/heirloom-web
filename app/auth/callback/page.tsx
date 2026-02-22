'use client';

import { useEffect, useState } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function CallbackPage() {
  const [status, setStatus] = useState('Completing sign-in…');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    (async () => {
      try {
        ensureAmplifyConfigured();

        const url = new URL(window.location.href);
        const error = url.searchParams.get('error');
        const errorDesc = url.searchParams.get('error_description');

        if (error) {
          setStatus('Sign-in failed (Cognito error).');
          setDetail(`${error}: ${errorDesc ?? ''}`);
          return;
        }

        // Wait for Amplify to finish PKCE exchange internally
        for (let i = 0; i < 10; i++) {
          try {
            await fetchAuthSession({ forceRefresh: true });
            await getCurrentUser();

            window.location.replace('/app');
            return;
          } catch {
            await sleep(400);
          }
        }

        throw new Error('Auth session not established.');
      } catch (e: any) {
        setStatus('Sign-in failed.');
        setDetail(String(e?.message ?? e));
      }
    })();
  }, []);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>{status}</p>
      {detail && (
        <>
          <p style={{ marginTop: 12, fontWeight: 600 }}>Details:</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{detail}</pre>
          <p style={{ marginTop: 16 }}>
            Try going back to <code>/login</code> and signing in again.
          </p>
        </>
      )}
    </main>
  );
}