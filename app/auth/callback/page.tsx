'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAmplifyConfigured } from '../../amplifyClient';
import { fetchAuthSession } from 'aws-amplify/auth';

function CallbackInner() {
  const router = useRouter();

  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working');
  const [message, setMessage] = useState<string>('Completing sign-in…');
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    async function run() {
      try {
        ensureAmplifyConfigured();

        // After Hosted UI redirects back, Amplify should be able to see the session.
        // We simply check for tokens; if present, proceed.
        const session = await fetchAuthSession();

        const hasTokens = !!session?.tokens?.accessToken && !!session?.tokens?.idToken;
        if (!hasTokens) {
          setStatus('error');
          setMessage(
            'No session tokens found after redirect. This usually means Amplify OAuth is not configured (aws-exports oauth is empty) or redirect URIs do not match.'
          );
          return;
        }

        setStatus('done');
        setMessage('Signed in. Redirecting…');
        router.replace('/app');
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'Unknown error completing sign-in.');
      }
    }

    run();
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>

      {status === 'working' && <p>Completing sign-in…</p>}
      {status === 'done' && <p>✅ {message}</p>}
      {status === 'error' && (
        <>
          <p style={{ fontWeight: 600 }}>Sign-in error.</p>
          <p>
            <span style={{ fontWeight: 600 }}>Reason:</span> {message}
          </p>
        </>
      )}
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<main style={{ padding: 32 }}>Loading…</main>}>
      <CallbackInner />
    </Suspense>
  );
}