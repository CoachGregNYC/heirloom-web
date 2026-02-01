'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working');
  const [message, setMessage] = useState<string>('Signing you in…');

  const hasRunRef = useRef(false);

  useEffect(() => {
    // Prevent double-run in dev / strict-mode quirks
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    async function run() {
      // If already signed in, go straight to /app
      const existingAccess = localStorage.getItem('heirloom_access_token');
      const existingId = localStorage.getItem('heirloom_id_token');
      if (existingAccess && existingId) {
        setStatus('done');
        setMessage('Already signed in. Redirecting…');
        router.replace('/app');
        return;
      }

      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Cognito returned an error
      if (error) {
        setStatus('error');
        setMessage(`${error}: ${errorDescription ?? 'Unknown error'}`);
        return;
      }

      // No code provided
      if (!code) {
        setStatus('error');
        setMessage('missing_code');
        return;
      }

      const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

      if (!domain || !clientId || !redirectUri) {
        setStatus('error');
        setMessage('Missing env vars: NEXT_PUBLIC_COGNITO_DOMAIN / CLIENT_ID / REDIRECT_URI');
        return;
      }

      try {
        // Exchange authorization code for tokens
        const tokenUrl = `${domain.replace(/\/$/, '')}/oauth2/token`;

        const body = new URLSearchParams();
        body.set('grant_type', 'authorization_code');
        body.set('client_id', clientId);
        body.set('code', code);
        body.set('redirect_uri', redirectUri);

        const res = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        if (!res.ok) {
          const txt = await res.text();
          setStatus('error');
          setMessage(`Token exchange failed: HTTP ${res.status} ${txt}`);
          return;
        }

        const data = (await res.json()) as {
          id_token?: string;
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
          token_type?: string;
        };

        if (!data.id_token || !data.access_token) {
          setStatus('error');
          setMessage('Token exchange succeeded but missing tokens (id_token/access_token).');
          return;
        }

        // Store tokens (simple approach for now)
        localStorage.setItem('heirloom_id_token', data.id_token);
        localStorage.setItem('heirloom_access_token', data.access_token);
        if (data.refresh_token) localStorage.setItem('heirloom_refresh_token', data.refresh_token);
        if (data.expires_in) localStorage.setItem('heirloom_expires_in', String(data.expires_in));

        setStatus('done');
        setMessage('Signed in. Redirecting…');
        router.replace('/app');
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'Unknown error during token exchange');
      }
    }

    run();
  }, [router, searchParams]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>

      {status === 'working' && <p>Signing you in…</p>}
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
  // useSearchParams must be inside Suspense for prerender/static export compatibility
  return (
    <Suspense fallback={<main style={{ padding: 32 }}>Loading…</main>}>
      <CallbackInner />
    </Suspense>
  );
}