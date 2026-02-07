'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const cfg = useMemo(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
    return { domain, clientId, redirectUri };
  }, []);

  // If we already have tokens, skip login
  const existingAccess =
    typeof window !== 'undefined' ? localStorage.getItem('heirloom_access_token') : null;
  const existingId =
    typeof window !== 'undefined' ? localStorage.getItem('heirloom_id_token') : null;

  if (existingAccess && existingId) {
    router.replace('/app');
    return null;
  }

  const onSignIn = () => {
    const { domain, clientId, redirectUri } = cfg;

    if (!domain || !clientId || !redirectUri) {
      alert('Missing env vars: NEXT_PUBLIC_COGNITO_DOMAIN / CLIENT_ID / REDIRECT_URI');
      return;
    }

    const authorizeUrl =
      `${domain.replace(/\/$/, '')}/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&prompt=login` +
      `&state=${encodeURIComponent(`heirloom-${Date.now()}`)}`;

    window.location.href = authorizeUrl;
  };

  const onGoHome = () => router.push('/');

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 6 }}>Heirloom</h1>
      <p style={{ marginTop: 0, color: '#444' }}>Preserve what matters. Private, secure, family-first.</p>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Sign in</h2>

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
      </div>
    </main>
  );
}