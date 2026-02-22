'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { getFamilyId } from '@/app/family';

type PhotoItem = {
  key: string;
  url?: string;
  filename?: string;
  lastModified?: string;
  size?: number;
};

export default function AppHome() {
  const router = useRouter();

  const familyId = useMemo(() => {
    return getFamilyId();
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadPhotos() {
    setError('');
    setLoading(true);
    try {
      ensureAmplifyConfigured();

      const data = await apiFetch(`/families/${familyId}/photos`, { method: 'GET' });
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
    setCreating(true);
    setError('');
    try {
      ensureAmplifyConfigured();

      const payload = {
        photoKey: selected.key,
        title: selected.filename ?? selected.key.split('/').pop() ?? 'Untitled',
      };

      await apiFetch(`/families/${familyId}/heirlooms`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Heirloom created ✅');
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
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
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Heirloom</h1>
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
      </div>

      <p style={{ marginTop: 8, color: '#444' }}>Family Filing Cabinet</p>

      {error ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={loadPhotos}
          disabled={loading}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>

        <button
          onClick={onCreateHeirloom}
          disabled={!selected || creating}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #0a7',
            background: selected ? '#0a7' : '#ddd',
            color: selected ? '#fff' : '#666',
            cursor: selected ? 'pointer' : 'not-allowed',
            opacity: creating ? 0.6 : 1,
          }}
        >
          {creating ? 'Creating…' : 'Create Heirloom from Selected Photo'}
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
                  <img src={thumb} alt={p.filename ?? p.key} style={{ width: '100%' }} />
                ) : (
                  <span style={{ color: '#888', fontSize: 12 }}>No preview</span>
                )}
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>
                {p.filename ?? p.key.split('/').pop() ?? p.key}
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}