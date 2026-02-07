'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Build OAuth config from env vars (Amplify Hosting environment variables)
  const cfg = useMemo(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // e.g. https://xxx.auth.us-east-1.amazoncognito.com
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI; // e.g. https://main....amplifyapp.com/auth/callback

    return { domain, clientId, redirectUri };
  }, []);

  useEffect(() => {
    // If we already have tokens from the callback, go straight to /app
    try {
      const access = localStorage.getItem('heirloom_access_token');
      const id = localStorage.getItem('heirloom_id_token');
      if (access && id) {
        router.replace('/app');
        return;
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }, [router]);

  const onSignIn = () => {
    const { domain, clientId, redirectUri } = cfg;

    if (!domain || !clientId || !redirectUri) {
      alert(
        'Missing env vars for Cognito login. Check Amplify Hosting env vars:\n' +
          'NEXT_PUBLIC_COGNITO_DOMAIN\n' +
          'NEXT_PUBLIC_COGNITO_CLIENT_ID\n' +
          'NEXT_PUBLIC_COGNITO_REDIRECT_URI'
      );
      return;
    }

    // IMPORTANT: Use /oauth2/authorize (NOT /login) for explicit OAuth params.
    const base = domain.replace(/\/$/, '');

    const state = `heirloom-${Date.now()}`; // simple CSRF-ish state marker
    try {
      sessionStorage.setItem('heirloom_oauth_state', state);
    } catch {
      // ignore
    }

    const url =
      `${base}/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=login`;

    window.location.href = url;
  };

  const onGoHome = () => router.push('/');

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 6 }}>Heirloom</h1>
      <p style={{ marginTop: 0, color: '#444' }}>Preserve what matters. Private, secure, family-first.</p>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Sign in</h2>

        {checking ? (
          <p>Checking session…</p>
        ) : (
          <>
            <button
              onClick={onSignIn}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #111',
                background: '#111',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Sign in
            </button>

            <button
              onClick={onGoHome}
              style={{
                marginLeft: 10,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </>
        )}
      </div>
    </main>
  );
}