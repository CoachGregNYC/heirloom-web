'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';

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

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function HeirloomsPage() {
  const router = useRouter();

  const familyId = useMemo(() => process.env.NEXT_PUBLIC_FAMILY_ID || '', []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [items, setItems] = useState<HeirloomItem[]>([]);
  const [deletingId, setDeletingId] = useState<string>('');

  async function loadHeirlooms() {
    setError('');
    setLoading(true);

    try {
      ensureAmplifyConfigured();

      if (!familyId) {
        throw new Error(
          'Missing NEXT_PUBLIC_FAMILY_ID. Add it to .env.local and Amplify environment variables.'
        );
      }

      const data = await apiFetch(`/families/${familyId}/heirlooms`, { method: 'GET' });
      const list: HeirloomItem[] = Array.isArray(data) ? data : data?.items ?? [];
      setItems(list);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteHeirloom(h: HeirloomItem) {
    const ok = window.confirm(`Delete heirloom "${h.title || 'Untitled'}"? This cannot be undone.`);
    if (!ok) return;

    setDeletingId(h.heirloomId);
    setError('');

    try {
      ensureAmplifyConfigured();

      // Assumes API route exists:
      // DELETE /families/{familyId}/heirlooms/{heirloomId}
      await apiFetch(`/families/${familyId}/heirlooms/${h.heirloomId}`, {
        method: 'DELETE',
      });

      // Optimistic remove
      setItems((prev) => prev.filter((x) => x.heirloomId !== h.heirloomId));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setDeletingId('');
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
    loadHeirlooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Heirloom</h1>

        <button
          onClick={() => router.push('/app')}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #999',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          ← Photos
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

      <p style={{ marginTop: 8, color: '#444' }}>Family Filing Cabinet · Heirlooms</p>

      {error ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={loadHeirlooms}
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

        <div style={{ color: '#666', fontSize: 14 }}>
          {items.length ? `${items.length} heirloom${items.length === 1 ? '' : 's'}` : 'No heirlooms yet'}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {items.map((h) => {
          const title = h.title || 'Untitled';
          const subtitleBits = [h.room, h.holiday].filter(Boolean);
          const subtitle = subtitleBits.join(' · ');
          const created = formatDate(h.createdAt);

          return (
            <button
              key={`${h.familyId}:${h.heirloomId}`}
              type="button"
              onClick={() => router.push(`/app/${h.heirloomId}`)}
              style={{
                textAlign: 'left',
                borderRadius: 14,
                border: '1px solid #ddd',
                background: '#fff',
                padding: 12,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 140,
                  borderRadius: 10,
                  background: '#f3f3f3',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {h.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.photoUrl}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: '#888', fontSize: 12 }}>No preview</span>
                )}

                {/* Admin delete button (does NOT navigate) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteHeirloom(h);
                  }}
                  disabled={deletingId === h.heirloomId}
                  title="Delete"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '6px 10px',
                    borderRadius: 10,
                    border: '1px solid #ddd',
                    background: '#fff',
                    cursor: deletingId === h.heirloomId ? 'not-allowed' : 'pointer',
                    opacity: deletingId === h.heirloomId ? 0.6 : 1,
                    fontSize: 12,
                  }}
                >
                  {deletingId === h.heirloomId ? 'Deleting…' : 'Delete'}
                </button>
              </div>

              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: '#111' }}>
                {title}
              </div>

              {subtitle ? (
                <div style={{ marginTop: 4, fontSize: 12, color: '#555' }}>{subtitle}</div>
              ) : null}

              {created ? (
                <div style={{ marginTop: 6, fontSize: 11, color: '#777' }}>Created: {created}</div>
              ) : null}

              {h.description ? (
                <div style={{ marginTop: 8, fontSize: 12, color: '#333', lineHeight: 1.35 }}>
                  {h.description}
                </div>
              ) : null}

              {h.tags?.length ? (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {h.tags.slice(0, 6).map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
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
            </button>
          );
        })}
      </div>
    </main>
  );
}