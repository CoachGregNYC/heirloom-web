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

function formatDate(input?: string) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString();
}

export default function HeirloomDetailPage() {
  const router = useRouter();
  const params = useParams<{ heirloomId: string }>();

  const familyId = useMemo(() => getFamilyId(), []);
  const heirloomId = params?.heirloomId || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [item, setItem] = useState<HeirloomItem | null>(null);

  async function load() {
    setError('');
    setLoading(true);

    try {
      ensureAmplifyConfigured();

      if (!familyId) throw new Error('Missing familyId (getFamilyId() returned empty).');
      if (!heirloomId) throw new Error('Missing heirloomId in route.');

      // ✅ Backend currently has a reliable LIST endpoint.
      // We fetch the list and find the specific item client-side.
      const data = await apiFetch(`/families/${familyId}/heirlooms`, { method: 'GET' });
      const items: HeirloomItem[] = Array.isArray(data) ? data : data?.items ?? [];

      const found =
        items.find((h) => h.heirloomId === heirloomId) ||
        items.find((h) => String(h.heirloomId) === String(heirloomId));

      setItem(found ?? null);
      if (!found) {
        setError('Not found.');
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    const ok = window.confirm(`Delete heirloom "${item.title || 'Untitled'}"? This cannot be undone.`);
    if (!ok) return;

    setError('');
    try {
      ensureAmplifyConfigured();

      // This will only work once your API Gateway DELETE route is deployed to the stage.
      await apiFetch(`/families/${familyId}/heirlooms/${item.heirloomId}`, { method: 'DELETE' });

      router.replace('/app/heirlooms');
    } catch (e: any) {
      setError(String(e?.message ?? e));
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heirloomId]);

  const title = item?.title || 'Untitled';
  const created = formatDate(item?.createdAt);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 980, margin: '0 auto' }}>
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

      {loading ? (
        <div style={{ marginTop: 16, color: '#666' }}>Loading…</div>
      ) : item ? (
        <div
          style={{
            marginTop: 16,
            border: '1px solid #e6e6e6',
            borderRadius: 14,
            padding: 16,
            background: '#fff',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
            <div
              style={{
                width: '100%',
                height: 320,
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
                <span style={{ color: '#888', fontSize: 12 }}>No preview</span>
              )}
            </div>

            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{title}</div>

              {item.description ? (
                <div style={{ marginTop: 10, color: '#333', lineHeight: 1.45 }}>{item.description}</div>
              ) : (
                <div style={{ marginTop: 10, color: '#777' }}>(No description)</div>
              )}

              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10, color: '#555' }}>
                {item.room ? <span>Room: {item.room}</span> : null}
                {item.holiday ? <span>Holiday: {item.holiday}</span> : null}
                {created ? <span>Created: {created}</span> : null}
              </div>

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

              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button
                  onClick={load}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #111',
                    background: '#111',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Refresh
                </button>

                <button
                  onClick={onDelete}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #c33',
                    background: '#fff',
                    color: '#c33',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: '#777' }}>
                Heirloom ID: <code>{item.heirloomId}</code>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}