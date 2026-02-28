import { Suspense } from 'react';
import CreateHeirloomClient from './createHeirloomClient';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CreateHeirloomPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};

  const photoKeyRaw = sp.photoKey;
  const photoKey = Array.isArray(photoKeyRaw) ? photoKeyRaw[0] : photoKeyRaw;

  const photoUrlRaw = sp.photoUrl;
  const photoUrl = Array.isArray(photoUrlRaw) ? photoUrlRaw[0] : photoUrlRaw;

  const filenameRaw = sp.filename;
  const filename = Array.isArray(filenameRaw) ? filenameRaw[0] : filenameRaw;

  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h1 style={{ margin: 0 }}>Heirloom</h1>
          <p style={{ marginTop: 8, color: '#444' }}>Loading…</p>
        </main>
      }
    >
      <CreateHeirloomClient
        initialPhotoKey={photoKey ?? ''}
        initialPhotoUrl={photoUrl ?? ''}
        initialFilename={filename ?? ''}
      />
    </Suspense>
  );
}