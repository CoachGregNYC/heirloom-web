// app/app/[heirloomId]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { getFamilyId } from '@/app/family';

type HeirloomItem = {
  familyId: string;
  heirloomId: string;

  title?: string;
  description?: string;

  room?: string;
  holiday?: string;
  tags?: string[];

  photoKey?: string;
  photoUrl?: string;

  createdAt?: string;
  createdBy?: string;
};

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function HeirloomDetailPage() {
  const router = useRouter();
  const params = useParams<{ heirloomId: string }>();

  const familyId = useMemo(() => getFamilyId(), []);
  const heirloomId = params?.heirloomId ?? '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [item, setItem] = useState<HeirloomItem | null>(null);

  const [deleting, setDeleting] = useState(false);

  async function loadHeirloom() {
    setError('');
    setLoading(true);

    try {
      ensureAmplifyConfigured();

      if (!familyId) throw new Error('Missing familyId (getFamilyId() returned empty).');
      if (!heirloomId) throw new Error('Missing heirloomId in route.');

      // Expect GET /families/:familyId/heirlooms/:heirloomId
      const data = await apiFetch(`/families/${familyId}/heirlooms/${heirloomId}`, { method: 'GET' });
      setItem(data as HeirloomItem);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!item) return;

    const ok = window.confirm(`Delete "${item.title ?? 'Untitled'}"? This cannot be undone.`);
    if (!ok) return;

    setDeleting(true);
    setError('');

    try {
      ensureAmplifyConfigured();

      if (!familyId) throw new Error('Missing familyId (getFamilyId() returned empty).');
      if (!heirloomId) throw new Error('Missing heirloomId in route.');

      // Expect DELETE /families/:familyId/heirlooms/:heirloomId
      await apiFetch(`/families/${familyId}/heirlooms/${heirloomId}`, {
        method: 'DELETE',
      });

      router.replace('/app/heirlooms');
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setDeleting(false);
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
    loadHeirloom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heirloomId]);

  const title = item?.title ?? 'Untitled';
  const created = formatDate(item?.createdAt);
  const subtitleBits = [item?.room, item?.holiday].filter(Boolean) as string[];
  const subtitle = subtitleBits.join(' · ');

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 920, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Heirloom</h1>

        <button
          onClick={() => router.push('/app/heirlooms')}
          style={{
            marginLeft: 8,
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #999',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          ← Filing Cabinet
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
      </div>

      <p style={{ marginTop: 8, color: '#444' }}>Heirloom Detail</p>

      {error ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 14,
          border: '1px solid #e6e6e6',
          borderRadius: 14,
          padding: 16,
          background: '#fff',
        }}
      >
        {loading ? (
          <div style={{ color: '#666' }}>Loading…</div>
        ) : !item ? (
          <div style={{ color: '#666' }}>Not found.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 360,
                  maxWidth: '100%',
                  height: 260,
                  borderRadius: 12,
                  background: '#f3f3f3',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photoUrl}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: '#888', fontSize: 12 }}>No photo</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{title}</div>

                {subtitle ? (
                  <div style={{ marginTop: 6, fontSize: 13, color: '#555' }}>{subtitle}</div>
                ) : null}

                {created ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#777' }}>Created: {created}</div>
                ) : null}

                {item.description ? (
                  <div style={{ marginTop: 12, fontSize: 14, color: '#222', lineHeight: 1.45 }}>
                    {item.description}
                  </div>
                ) : (
                  <div style={{ marginTop: 12, fontSize: 13, color: '#777' }}>
                    No description yet.
                  </div>
                )}

                {item.tags?.length ? (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: '#f2f2f2',
                          color: '#333',
                          border: '1px solid #e6e6e6',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={loadHeirloom}
                    disabled={loading}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #111',
                      background: '#111',
                      color: '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    Refresh
                  </button>

                  <button
                    onClick={onDelete}
                    disabled={deleting}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #d33',
                      background: deleting ? '#eee' : '#fff',
                      color: deleting ? '#888' : '#d33',
                      cursor: deleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>

                <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
                  <div>
                    <strong>heirloomId:</strong> <code>{item.heirloomId}</code>
                  </div>
                  {item.photoKey ? (
                    <div style={{ marginTop: 6 }}>
                      <strong>photoKey:</strong> <code>{item.photoKey}</code>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}