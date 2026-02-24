'use client';

import { useParams, useRouter } from 'next/navigation';

export default function HeirloomDetailPage() {
  const router = useRouter();
  const params = useParams<{ heirloomId: string }>();

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Heirloom</h1>
        <button
          onClick={() => router.push('/app/heirlooms')}
          style={{
            marginLeft: 'auto',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #999',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>

      <p style={{ marginTop: 16 }}>
        Heirloom ID: <code>{params?.heirloomId}</code>
      </p>

      <p style={{ color: '#666' }}>
        Next step will be: fetch details from the API and show title/description/tags/photo.
      </p>
    </main>
  );
}