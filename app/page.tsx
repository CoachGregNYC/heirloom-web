'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const access = localStorage.getItem('heirloom_access_token');
    const id = localStorage.getItem('heirloom_id_token');

    if (access && id) router.replace('/app');
    else router.replace('/login');
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>
      <p>Loading…</p>
    </main>
  );
}