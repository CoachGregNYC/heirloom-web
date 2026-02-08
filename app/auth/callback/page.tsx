'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(`${error}: ${errorDescription ?? 'Unknown error'}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Missing "code" in callback URL.');
        return;
      }

      const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // e.g. https://us-east-1xxxx.auth.us-east-1.amazoncognito.com
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

      if (!domain || !clientId || !redirectUri) {
        setStatus('error');
        setMessage('Missing env vars: NEXT_PUBLIC_COGNITO_DOMAIN / CLIENT_ID / REDIRECT_URI');
        return;
      }

      try {
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
          setMessage('Token exchange succeeded but missing id_token/access_token.');
          return;
        }

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

      {status === 'working' && <p>Completing sign-in…</p>}
      {status === 'done' && <p>✅ {message}</p>}
      {status === 'error' && (
        <>
          <p style={{ fontWeight: 700 }}>Sign-in error.</p>
          <p>
            <span style={{ fontWeight: 700 }}>Reason:</span> {message}
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