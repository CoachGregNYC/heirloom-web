'use client';

import { useEffect, useState } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';

function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export default function CallbackPage() {
  const [status, setStatus] = useState('Exchanging auth code for tokens (fetchAuthSession)…');
  const [detail, setDetail] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        ensureAmplifyConfigured();

        const url = new URL(window.location.href);
        const err = url.searchParams.get('error');
        const errDesc = url.searchParams.get('error_description');

        if (err) {
          setStatus('Sign-in failed (Cognito returned an error).');
          setDetail(`${err}: ${errDesc ?? ''}`);
          return;
        }

        const code = url.searchParams.get('code');
        if (!code) {
          setStatus('Missing ?code= on callback URL.');
          return;
        }

        // This should succeed once the oauth listener is enabled.
        await withTimeout(fetchAuthSession(), 20000);

        // Optional sanity check (nice for debugging)
        await withTimeout(getCurrentUser(), 20000);

        setStatus('Signed in ✅ Redirecting…');
        window.location.replace('/app');
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
      {detail ? <pre style={{ whiteSpace: 'pre-wrap' }}>{detail}</pre> : null}
    </main>
  );
}