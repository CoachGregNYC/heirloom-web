'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    const idToken = localStorage.getItem('heirloom_id_token');
    const accessToken = localStorage.getItem('heirloom_access_token');

    if (!idToken || !accessToken) {
      router.replace('/');
    }
  }, [router]);

  function signOut() {
    localStorage.removeItem('heirloom_id_token');
    localStorage.removeItem('heirloom_access_token');
    localStorage.removeItem('heirloom_refresh_token');
    localStorage.removeItem('heirloom_expires_in');

    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI;

    if (domain && clientId && logoutUri) {
      const logoutUrl =
        `${domain.replace(/\/$/, '')}/logout` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&logout_uri=${encodeURIComponent(logoutUri)}`;

      window.location.href = logoutUrl;
    } else {
      router.replace('/');
    }
  }

  return (
    <main
      style={{
        padding: 32,
        fontFamily: 'system-ui',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>
      <p style={{ marginBottom: 24 }}>✅ Signed in.</p>

      <section
        style={{
          padding: 20,
          border: '1px solid #ddd',
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <p>
          This is the protected Heirloom application area.
        </p>
        <p>
          Users must be authenticated via Cognito to see this page.
        </p>
      </section>

      <button
        onClick={signOut}
        style={{
          padding: '10px 16px',
          fontSize: 14,
          cursor: 'pointer',
          borderRadius: 6,
          border: '1px solid #ccc',
          background: '#fff',
        }}
      >
        Sign out
      </button>
    </main>
  );
}