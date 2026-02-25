// app/app/heirlooms/create/createHeirloomClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { getFamilyId } from '@/app/family';

const ROOM_OPTIONS = ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Basement', 'Attic', 'Other'];
const HOLIDAY_OPTIONS = [
  'None',
  'Christmas',
  'Hanukkah',
  'Thanksgiving',
  'Easter',
  'Halloween',
  'Birthday',
  'Other',
];
const TAG_OPTIONS = ['Photo', 'Document', 'Jewelry', 'Furniture', 'Artwork', 'Military', 'Travel', 'Recipe', 'Letter'];

export default function CreateHeirloomClient({ initialPhotoKey }: { initialPhotoKey: string }) {
  const router = useRouter();

  const familyId = useMemo(() => getFamilyId(), []);

  // Keep photoKey stable and explicit (and show a clear error if missing)
  const [photoKey] = useState<string>(initialPhotoKey || '');

  const [title, setTitle] = useState<string>(() => {
    if (!initialPhotoKey) return '';
    const parts = initialPhotoKey.split('/');
    return parts[parts.length - 1] || '';
  });
  const [description, setDescription] = useState<string>('');
  const [room, setRoom] = useState<string>(ROOM_OPTIONS[0]);
  const [holiday, setHoliday] = useState<string>('None');
  const [tags, setTags] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // If we ever land here without a photoKey, fail fast (prevents “mystery” submits)
  useEffect(() => {
    if (!photoKey) {
      setError('Missing photoKey. Go back to Photos and select a photo again.');
    }
  }, [photoKey]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function onCreate() {
    setError('');
    setSaving(true);

    try {
      ensureAmplifyConfigured();

      if (!familyId) throw new Error('Missing familyId (getFamilyId() returned empty).');
      if (!photoKey) throw new Error('Missing photoKey. Go back to Photos and select a photo again.');
      if (!title.trim()) throw new Error('Title is required.');

      const payload = {
        photoKey,
        title: title.trim(),
        description: description.trim(),
        room: room || undefined,
        holiday: holiday === 'None' ? undefined : holiday,
        tags: tags.length ? tags : undefined,
      };

      await apiFetch(`/families/${familyId}/heirlooms`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.replace('/app/heirlooms');
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
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

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Heirloom</h1>

        <button
          type="button"
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
          type="button"
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

        <button
          type="button"
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

      <p style={{ marginTop: 8, color: '#444' }}>Create Heirloom</p>

      {error ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      ) : null}

      {/* Wrap inputs in a real <form> and control submission explicitly.
          This prevents “random” page navigations and keeps photoKey stable. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCreate();
        }}
        style={{
          marginTop: 16,
          border: '1px solid #e6e6e6',
          borderRadius: 14,
          padding: 16,
          background: '#fff',
        }}
      >
        <div style={{ fontSize: 12, color: '#666' }}>Selected photoKey</div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#111', wordBreak: 'break-all' }}>
          {photoKey || '(missing)'}
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#444' }}>Title *</span>
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
            <span style={{ fontSize: 12, color: '#444' }}>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add the story behind this…"
              rows={5}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#444' }}>Room</span>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  background: '#fff',
                }}
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#444' }}>Holiday</span>
              <select
                value={holiday}
                onChange={(e) => setHoliday(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  background: '#fff',
                }}
              >
                {HOLIDAY_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#444' }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TAG_OPTIONS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={(e) => {
                      // Double safety: even though type="button", stop any bubbling.
                      e.preventDefault();
                      e.stopPropagation();
                      toggleTag(t);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: on ? '1px solid #0a7' : '1px solid #ddd',
                      background: on ? '#0a7' : '#fff',
                      color: on ? '#fff' : '#111',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #111',
                background: '#111',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Creating…' : 'Create Heirloom'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/app')}
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
        </div>
      </form>
    </main>
  );
}