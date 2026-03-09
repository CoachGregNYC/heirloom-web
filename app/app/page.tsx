// app/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { useMe } from '@/app/useMe';

type PhotoItem = {
  key: string;
  url?: string;
  filename?: string;
  lastModified?: string;
  size?: number;
};

export default function AppHome() {
  const router = useRouter();

  const { me, loading: meLoading, error: meError, refresh: refreshMe } = useMe();
  const familyId = me?.familyId || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  async function loadPhotos(fid: string) {
    setError('');
    setLoading(true);
    try {
      ensureAmplifyConfigured();

      const data = await apiFetch(`/families/${fid}/photos`, { method: 'GET' });
      const items: PhotoItem[] = Array.isArray(data) ? data : data?.items ?? [];
      setPhotos(items);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function onCreateHeirloom() {
    if (!selected) return;

    const filename = selected.filename ?? selected.key.split('/').pop() ?? '';
    const photoUrl = selected.url ?? '';

    // Persist so Create page can recover even if query params are lost
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('heirloom_selected_photoKey', selected.key);
      window.sessionStorage.setItem('heirloom_selected_photoUrl', photoUrl);
      window.sessionStorage.setItem('heirloom_selected_filename', filename);
    }

    const qs = new URLSearchParams({
      photoKey: selected.key,
      photoUrl,
      filename,
    });

    router.push(`/app/heirlooms/create?${qs.toString()}`);
  }

  async function onSignOut() {
    try {
      ensureAmplifyConfigured();
      await signOut();
    } finally {
      router.replace('/login');
    }
  }

  useEffect(() => {
    ensureAmplifyConfigured(); getCurrentUser().then(user => {
      setUserEmail(user.signInDetails?.loginId ?? ''); console.log("getCurrentUser result:", JSON.stringify(user)); console.log("getCurrentUser result:", JSON.stringify(user));
    }).catch(() => {});
  }, []);

  // Once /me resolves and we have a familyId, load photos
  useEffect(() => {
    if (meLoading) return;
    if (meError) throw new Error(meError);
    if (!familyId) throw new Error('Missing familyId from /me (membership not found).');
    loadPhotos(familyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, familyId]);

  const effectiveError = meError || error;

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Heirloom</h1>

        <button
          onClick={() => router.push('/app/heirlooms')}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #999',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Heirlooms →
        </button>

        <button
          onClick={onSignOut}
          style={{
            marginLeft: 'auto',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #999',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
        {userEmail && (
          <span style={{ fontSize: 13, color: '#666' }}>{userEmail}</span>
        )}
      </div>

      <p style={{ marginTop: 8, color: '#444' }}>{userEmail ? `${userEmail} · ` : ''}Family Filing Cabinet</p>

      {effectiveError ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{effectiveError}</div>

          {meError ? (
            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <button
                onClick={refreshMe}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid #111',
                  background: '#111',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Retry /me
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!meLoading && !familyId ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            No familyId returned from /me. This user is not in the memberships table yet.
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => familyId && loadPhotos(familyId)}
          disabled={loading || meLoading || !familyId}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
            opacity: loading || meLoading || !familyId ? 0.6 : 1,
          }}
        >
          {meLoading ? 'Loading…' : loading ? 'Loading…' : 'Refresh'}
        </button>

        <button
          onClick={onCreateHeirloom}
          disabled={!selected}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #0a7',
            background: selected ? '#0a7' : '#ddd',
            color: selected ? '#fff' : '#666',
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          Create Heirloom from Selected Photo
        </button>

        <div style={{ color: '#666', fontSize: 14 }}>
          {selected ? `Selected: ${selected.filename ?? selected.key}` : 'No photo selected'}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {photos.map((p) => {
          const isSelected = selected?.key === p.key;
          const thumb = p.url;
          const label = p.filename ?? p.key.split('/').pop() ?? p.key;

          return (
            <button
              key={p.key}
              onClick={() => setSelected(p)}
              style={{
                textAlign: 'left',
                borderRadius: 14,
                border: isSelected ? '2px solid #0a7' : '1px solid #ddd',
                background: '#fff',
                padding: 10,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 120,
                  borderRadius: 10,
                  background: '#f3f3f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#888', fontSize: 12 }}>No preview</span>
                )}
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>{label}</div>
            </button>
          );
        })}
      </div>

      {!meLoading && !loading && photos.length === 0 ? (
        <div style={{ marginTop: 18, color: '#666' }}>No photos found.</div>
      ) : null}
    </main>
  );
}