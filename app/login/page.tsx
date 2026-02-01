'use client';

import { useMemo } from 'react';

export default function LoginPage() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!;

  const loginUrl = useMemo(() => {
    const url = new URL(`${domain}/login`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('redirect_uri', redirectUri);
    return url.toString();
  }, [domain, clientId, redirectUri]);

  return (
    <main style={{ padding: 32, maxWidth: 420 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Heirloom</h1>
      <p style={{ marginBottom: 24 }}>Sign in to continue.</p>

      <a
        href={loginUrl}
        style={{
          display: 'inline-block',
          padding: '12px 16px',
          borderRadius: 10,
          border: '1px solid #ccc',
          textDecoration: 'none',
        }}
      >
        Sign in (Email + Password)
      </a>
    </main>
  );
}