'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ErrorBody() {
  const sp = useSearchParams();
  const reason = sp.get('reason') ?? 'unknown';

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ margin: 0 }}>Heirloom</h1>
      <p style={{ marginTop: 8 }}>Sign-in error.</p>

      <p style={{ marginTop: 16 }}>
        <strong>Reason:</strong> {reason}
      </p>

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        You can close this tab and try signing in again.
      </p>
    </main>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<main style={{ padding: 32 }}>Loading…</main>}>
      <ErrorBody />
    </Suspense>
  );
}