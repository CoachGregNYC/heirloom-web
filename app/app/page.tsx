// app/app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { getFamilyId } from '@/app/family';

type PhotoItem = {
  key: string;

  // Optional fields your API may return
  url?: string; // presigned URL (ideal)
  filename?: string;
  lastModified?: string;
  size?: number;
};

type HeirloomItem = {
  id?: string;
  heirloomId?: string;
  photoKey?: string;
  title?: string;
  createdAt?: string;
};

function basename(key: string) {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

function looksLikeImageKey(key: string) {
  return /\.(png|jpe?g|gif|webp|heic)$/i.test(key);
}

export default function AppHome() {
  const router = useRouter();

  const familyId = useMemo(() => {
    // Single source of truth (Option A MVP)
    return getFamilyId();
  }, []);

  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingHeirlooms, setLoadingHeirlooms] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [heirlooms, setHeirlooms] = useState<HeirloomItem[]>([]);
  const [selected, setSelected] = useState<PhotoItem | null>(null);

  async function loadPhotos() {
    setError('');
    setLoadingPhotos(true);
    try {
      ensureAmplifyConfigured();

      const data = await apiFetch(`/families/${familyId}/photos`, { method: 'GET' });
      const items: PhotoItem[] = Array.isArray(data) ? data : data?.items ?? [];

      // If your backend doesn’t return filename, infer it from key for UI
      const normalized = items.map((p) => ({
        ...p,
        filename: p.filename ?? basename(p.key),
      }));

      setPhotos(normalized);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }

  async function loadHeirlooms() {
    setError('');
    setLoadingHeirlooms(true);
    try {
      ensureAmplifyConfigured();

      // This will work once your backend implements it.
      // If not implemented yet, we’ll show a gentle message.
      const data = await apiFetch(`/families/${familyId}/heirlooms`, { method: 'GET' });
      const items: HeirloomItem[] = Array.isArray(data) ? data : data?.items ?? [];
      setHeirlooms(items);
    } catch (e: any) {
      // Don’t hard-fail the whole page if GET heirlooms isn’t ready yet.
      const msg = String(e?.message ?? e);
      if (/404|not found|route/i.test(msg)) {
        setHeirlooms([]);
      } else {
        setError(msg);
      }
    } finally {
      setLoadingHeirlooms(false);
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
        title: selected.filename ?? basename(selected.key) ?? 'Untitled',
      };

      await apiFetch(`/families/${familyId}/heirlooms`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Heirloom created ✅');
      await loadHeirlooms();
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
    // Initial load
    void loadPhotos();
    void loadHeirlooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLabel = selected ? `Selected: ${selected.filename ?? selected.key}` : 'No photo selected';

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Heirloom</h1>
          <div style={{ marginTop: 4, color: '#444', fontSize: 14 }}>Family Filing Cabinet</div>
          <div style={{ marginTop: 2, color: '#888', fontSize: 12 }}>
            FamilyId (MVP): <code>{familyId}</code>
          </div>
        </div>

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

      {/* Error */}
      {error ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{error}</div>
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={loadPhotos}
          disabled={loadingPhotos}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
            opacity: loadingPhotos ? 0.6 : 1,
          }}
        >
          {loadingPhotos ? 'Loading photos…' : 'Refresh photos'}
        </button>

        <button
          onClick={loadHeirlooms}
          disabled={loadingHeirlooms}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #333',
            background: '#fff',
            color: '#111',
            cursor: 'pointer',
            opacity: loadingHeirlooms ? 0.6 : 1,
          }}
        >
          {loadingHeirlooms ? 'Loading heirlooms…' : 'Refresh heirlooms'}
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

        <div style={{ color: '#666', fontSize: 14 }}>{selectedLabel}</div>
      </div>

      {/* Layout: Photos (left) + Heirlooms (right) */}
      <div
        style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 1fr) minmax(320px, 420px)',
          gap: 16,
        }}
      >
        {/* Photos Panel */}
        <section
          style={{
            border: '1px solid #eee',
            borderRadius: 14,
            padding: 14,
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Photos</h2>
            <div style={{ color: '#777', fontSize: 12 }}>{photos.length} item(s)</div>
          </div>

          {loadingPhotos ? (
            <div style={{ marginTop: 12, color: '#666' }}>Loading…</div>
          ) : photos.length === 0 ? (
            <div style={{ marginTop: 12, color: '#666' }}>
              No photos returned yet. (This is normal until your backend lists S3 keys and/or presigned URLs.)
            </div>
          ) : (
            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 12,
              }}
            >
              {photos.map((p) => {
                const isSelected = selected?.key === p.key;

                // Prefer API-provided presigned URL
                const thumb = p.url;
                const canPreview = Boolean(thumb) && looksLikeImageKey(p.key);

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
                    title={p.key}
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
                      {canPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={p.filename ?? p.key}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: '#888', fontSize: 12 }}>{thumb ? 'No image preview' : 'No preview URL'}</span>
                      )}
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>
                      {p.filename ?? basename(p.key)}
                    </div>

                    <div style={{ marginTop: 4, fontSize: 11, color: '#777', wordBreak: 'break-word' }}>
                      {p.key}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Heirlooms Panel */}
        <section
          style={{
            border: '1px solid #eee',
            borderRadius: 14,
            padding: 14,
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Heirlooms</h2>
            <div style={{ color: '#777', fontSize: 12 }}>{heirlooms.length} item(s)</div>
          </div>

          <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
            This is the “family file cabinet” list. Once your GET route is implemented, it will populate automatically.
          </div>

          {loadingHeirlooms ? (
            <div style={{ marginTop: 12, color: '#666' }}>Loading…</div>
          ) : heirlooms.length === 0 ? (
            <div style={{ marginTop: 12, color: '#666' }}>
              No heirlooms yet. Select a photo and click <strong>Create Heirloom</strong>.
            </div>
          ) : (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {heirlooms.map((h, idx) => {
                const id = h.id ?? h.heirloomId ?? String(idx);
                const title = h.title ?? (h.photoKey ? basename(h.photoKey) : 'Untitled');
                const when = h.createdAt ? new Date(h.createdAt).toLocaleString() : '';

                return (
                  <div
                    key={id}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 12,
                      padding: 10,
                      background: '#fafafa',
                    }}
                  >
                    <div style={{ fontSize: 13, color: '#111', fontWeight: 600 }}>{title}</div>
                    {h.photoKey ? (
                      <div style={{ marginTop: 4, fontSize: 11, color: '#666', wordBreak: 'break-word' }}>
                        photoKey: {h.photoKey}
                      </div>
                    ) : null}
                    {when ? <div style={{ marginTop: 4, fontSize: 11, color: '#666' }}>{when}</div> : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}