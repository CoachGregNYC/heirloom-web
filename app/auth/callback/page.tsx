'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureAmplifyConfigured } from '../../amplifyClient';
import { handleSignInRedirect, fetchAuthSession } from 'aws-amplify/auth';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'working' | 'error'>('working');
  const [message, setMessage] = useState<string>('Completing sign-in…');

  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      try {
        ensureAmplifyConfigured();

        // If Cognito returned an error
        const err = searchParams.get('error');
        const errDesc = searchParams.get('error_description');
        if (err) {
          setStatus('error');
          setMessage(`${err}: ${errDesc ?? 'Unknown error'}`);
          return;
        }

        // This performs the code exchange + stores tokens in Amplify’s storage
        await handleSignInRedirect();

        // Sanity check: confirm we now have tokens
        const session = await fetchAuthSession();
        const hasTokens = !!session?.tokens?.accessToken && !!session?.tokens?.idToken;

        if (!hasTokens) {
          setStatus('error');
          setMessage('Sign-in redirect completed but tokens were not established.');
          return;
        }

        router.replace('/app');
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'Unknown error completing sign-in.');
      }
    }

    run();
  }, [router, searchParams]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>

      {status === 'working' && <p>Completing sign-in…</p>}
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