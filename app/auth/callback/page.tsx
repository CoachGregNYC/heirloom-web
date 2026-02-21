'use client';

import { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';

function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<string>('Exchanging auth code for tokens (fetchAuthSession)…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        ensureAmplifyConfigured();

        // This should complete the OAuth redirect processing and populate tokens.
        const session = await withTimeout(fetchAuthSession(), 20000);

        const hasTokens =
          !!session.tokens?.accessToken || !!session.tokens?.idToken;

        // eslint-disable-next-line no-console
        console.log('[callback] fetchAuthSession ok', {
          hasTokens,
          hasAccessToken: !!session.tokens?.accessToken,
          hasIdToken: !!session.tokens?.idToken,
        });

        if (!hasTokens) {
          throw new Error('No tokens returned from fetchAuthSession().');
        }

        if (!cancelled) {
          setStatus('Signed in. Redirecting…');
          window.location.replace('/app');
        }
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('[callback] sign-in failed', e);

        if (!cancelled) {
          setError(String(e?.message ?? e));
          setStatus('Sign-in failed.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ margin: 0 }}>Heirloom</h1>
      <p style={{ marginTop: 12 }}>{status}</p>

      {error ? (
        <div style={{ marginTop: 16 }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>
          <p style={{ marginTop: 12 }}>
            <a href="/login">Back to Login</a>
          </p>
        </div>
      ) : null}
    </main>
  );
}