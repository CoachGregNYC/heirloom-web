// app/app/heirlooms/create/page.tsx
import { Suspense } from 'react';
import CreateHeirloomClient from './createHeirloomClient';

export default function CreateHeirloomPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const photoKeyRaw = searchParams?.photoKey;
  const photoKey = Array.isArray(photoKeyRaw) ? photoKeyRaw[0] : photoKeyRaw;

  // Even though we avoid useSearchParams, wrapping in Suspense is still safe and future-proof.
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h1 style={{ margin: 0 }}>Heirloom</h1>
          <p style={{ marginTop: 8, color: '#444' }}>Loading…</p>
        </main>
      }
    >
      <CreateHeirloomClient initialPhotoKey={photoKey ?? ''} />
    </Suspense>
  );
}