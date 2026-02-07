'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const cfg = useMemo(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // e.g. https://us-east-1-xxxx.auth.us-east-1.amazoncognito.com
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI; // MUST match Cognito allowed callback URL exactly

    return { domain, clientId, redirectUri };
  }, []);

  const onSignIn = () => {
    const { domain, clientId, redirectUri } = cfg;

    if (!domain || !clientId || !redirectUri) {
      alert(
        'Missing env vars.\n\nNeed:\nNEXT_PUBLIC_COGNITO_DOMAIN\nNEXT_PUBLIC_COGNITO_CLIENT_ID\nNEXT_PUBLIC_COGNITO_REDIRECT_URI'
      );
      return;
    }

    const base = domain.replace(/\/$/, '');

    // Use /oauth2/authorize (standard OIDC) rather than /login
    const authorizeUrl =
      `${base}/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(`heirloom-${Date.now()}`)}` +
      `&prompt=${encodeURIComponent('login')}`;

    window.location.assign(authorizeUrl);
  };

  const onGoHome = () => {
    router.push('/');
  };

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 6 }}>Heirloom</h1>
      <p style={{ marginTop: 0, color: '#444' }}>
        Preserve what matters. Private, secure, family-first.
      </p>

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
          Continue to Sign In
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

        <p style={{ marginTop: 16, color: '#666', fontSize: 13, lineHeight: 1.4 }}>
          This button opens Cognito&apos;s hosted sign-in page (email + password). No AWS keys are used in the browser.
        </p>
      </div>
    </main>
  );
}