'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackBody() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const code = sp.get('code');
    const error = sp.get('error');
    const errorDescription = sp.get('error_description');

    // If Cognito sent an error back
    if (error) {
      const reason = errorDescription ? `${error}: ${errorDescription}` : error;
      router.replace(`/auth/error?reason=${encodeURIComponent(reason)}`);
      return;
    }

    // If missing code, show friendly error
    if (!code) {
      router.replace('/auth/error?reason=missing_code');
      return;
    }

    /**
     * IMPORTANT:
     * For now we are NOT exchanging the code for tokens in the browser.
     * We’re just confirming the redirect worked.
     *
     * Next step later:
     * Exchange code -> tokens in a server route (or Next middleware) and set a secure cookie.
     */
    router.replace('/'); // or /dashboard when you make it
  }, [router, sp]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ margin: 0 }}>Heirloom</h1>
      <p style={{ marginTop: 12 }}>Finishing sign-in…</p>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<main style={{ padding: 32 }}>Finishing sign-in…</main>}>
      <CallbackBody />
    </Suspense>
  );
}