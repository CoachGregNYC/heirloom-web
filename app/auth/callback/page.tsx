'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureAmplifyConfigured } from '../../amplifyClient';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working');
  const [message, setMessage] = useState<string>('Completing sign-in…');

  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    async function run() {
      try {
        ensureAmplifyConfigured();

        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (error) {
          setStatus('error');
          setMessage(`${error}: ${errorDescription ?? 'Unknown error'}`);
          return;
        }

        const code = searchParams.get('code');
        if (!code) {
          setStatus('error');
          setMessage('missing_code');
          return;
        }

        // This is the key: let Amplify complete the Hosted UI redirect
        // and establish Cognito UserPool session + Identity Pool credentials.
        await fetchAuthSession({ forceRefresh: true });

        // Confirm user exists
        await getCurrentUser();

        setStatus('done');
        setMessage('Signed in. Redirecting…');
        router.replace('/app');
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'Unknown error completing sign-in');
      }
    }

    run();
  }, [router, searchParams]);

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