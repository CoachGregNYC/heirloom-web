'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { useMe } from '@/app/useMe';

type CreateHeirloomBody = {
  photoKey: string;
  title?: string;
  description?: string;
  room?: string;
  holiday?: string;
  tags?: string[];
};

const SESSION_KEY = 'heirloom.create.photoKey';

export default function CreateHeirloomClient({ initialPhotoKey }: { initialPhotoKey: string }) {
  const router = useRouter();
  const { me, loading: meLoading, error: meError, refresh: refreshMe } = useMe();
  const familyId = me?.familyId || '';

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [photoKey, setPhotoKey] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [room, setRoom] = useState<string>('Living Room');
  const [holiday, setHoliday] = useState<string>('None');
  const [tags, setTags] = useState<string[]>(['Photo']);

  const resolvedInitialPhotoKey = useMemo(() => (initialPhotoKey ?? '').trim(), [initialPhotoKey]);

  // Resolve photoKey from:
  // 1) query param (initialPhotoKey)
  // 2) sessionStorage fallback
  useEffect(() => {
    const fromQuery = resolvedInitialPhotoKey;
    const fromSession = typeof window !== 'undefined' ? window.sessionStorage.getItem(SESSION_KEY) : '';

    const chosen = (fromQuery || fromSession || '').trim();
    setPhotoKey(chosen);

    // Persist for refresh safety
    if (chosen && typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_KEY, chosen);
    }
  }, [resolvedInitialPhotoKey]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function onSubmit() {
    setError('');
    setSaving(true);

    try {
      ensureAmplifyConfigured();

      const pk = photoKey.trim();
      if (!pk) {
        throw new Error('Missing photoKey. Go back to Photos and select a photo again.');
      }

      if (!familyId) {
        throw new Error('Missing familyId from /me. Add membership row for this userSub.');
      }

      const body: CreateHeirloomBody = {
        photoKey: pk,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        room: room || undefined,
        holiday: holiday || undefined,
        tags: tags.length ? tags : undefined,
      };

      await apiFetch(`/families/${familyId}/heirlooms`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Success: clear the draft photoKey so the next create doesn’t accidentally reuse it
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(SESSION_KEY);
      }

      router.replace('/app/heirlooms');
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const effectiveError = meError || error;

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Heirloom</h1>

        <button
          onClick={() => router.push('/app')}
          style={{
            marginLeft: 'auto',
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
          onClick={() => router.push('/app/heirlooms')}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #999',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Filing Cabinet
        </button>
      </div>

      <p style={{ marginTop: 8, color: '#444' }}>Create Heirloom</p>

      {effectiveError ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{effectiveError}</div>

          {meError ? (
            <div style={{ marginTop: 10 }}>
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

      <div style={{ marginTop: 14, padding: 14, border: '1px solid #ddd', borderRadius: 14 }}>
        <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
          Selected photoKey
          <div style={{ marginTop: 6 }}>
            <code>{photoKey ? photoKey : '(missing)'}</code>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, color: '#333' }}>
              Title <span style={{ color: '#c00' }}>*</span>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dad’s Navy Photo"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, color: '#333' }}>Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add the story behind this..."
              rows={4}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 12, color: '#333' }}>Room</div>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ccc' }}
              >
                <option>Living Room</option>
                <option>Bedroom</option>
                <option>Kitchen</option>
                <option>Office</option>
                <option>Storage</option>
                <option>Other</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 12, color: '#333' }}>Holiday</div>
              <select
                value={holiday}
                onChange={(e) => setHoliday(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ccc' }}
              >
                <option>None</option>
                <option>Christmas</option>
                <option>Thanksgiving</option>
                <option>Hanukkah</option>
                <option>Easter</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 2 }}>
            <div style={{ fontSize: 12, color: '#333', marginBottom: 8 }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Photo', 'Document', 'Jewelry', 'Furniture', 'Artwork', 'Military', 'Travel', 'Recipe', 'Letter'].map(
                (t) => {
                  const on = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid ' + (on ? '#111' : '#ddd'),
                        background: on ? '#111' : '#fff',
                        color: on ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {t}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving || meLoading}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #111',
                background: '#111',
                color: '#fff',
                cursor: saving || meLoading ? 'not-allowed' : 'pointer',
                opacity: saving || meLoading ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating…' : meLoading ? 'Loading…' : 'Create Heirloom'}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #999',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>

          <div style={{ marginTop: 10, color: '#777', fontSize: 12 }}>
            Membership: {meLoading ? 'loading…' : familyId ? `familyId=${familyId}` : 'no familyId'}
          </div>
        </div>
      </div>
    </main>
  );
}