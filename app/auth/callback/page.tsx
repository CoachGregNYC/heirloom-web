'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAmplifyConfigured } from '../../amplifyClient';
import { fetchAuthSession } from 'aws-amplify/auth';

function CallbackInner() {
  const router = useRouter();
  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working');
  const [message, setMessage] = useState('Finishing sign-in…');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      try {
        ensureAmplifyConfigured();

        // Give Amplify a moment to process the Hosted UI redirect
        // (fetchAuthSession will succeed once tokens are set)
        const session = await fetchAuthSession();

        if (session?.tokens?.accessToken && session?.tokens?.idToken) {
          setStatus('done');
          setMessage('Signed in. Redirecting…');
          router.replace('/app');
          return;
        }

        setStatus('error');
        setMessage('No tokens found in session after redirect.');
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'Failed to complete sign-in.');
      }
    }

    run();
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>

      {status === 'working' && <p>{message}</p>}
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