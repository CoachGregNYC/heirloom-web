'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { getFamilyId } from '@/app/family';

type CreatePayload = {
  photoKey: string;
  title: string;
  description?: string;
  room?: string;
  holiday?: string;
  tags?: string[];
};

const ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Basement', 'Attic', 'Garage', 'Other'] as const;
const HOLIDAYS = [
  'Birthday',
  'Christmas',
  'Hanukkah',
  'Thanksgiving',
  'Easter',
  'Halloween',
  'New Year',
  'Wedding',
  'Anniversary',
  'Other',
] as const;

export default function CreateHeirloomPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h1 style={{ margin: 0 }}>Heirloom</h1>
          <p style={{ marginTop: 8, color: '#444' }}>Loading…</p>
        </main>
      }
    >
      <CreateHeirloomInner />
    </Suspense>
  );
}

function CreateHeirloomInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const familyId = useMemo(() => getFamilyId(), []);

  const photoKey = sp.get('photoKey') ?? '';
  const photoUrl = sp.get('photoUrl') ?? '';

  const initialTitle =
    sp.get('filename') ||
    (photoKey ? decodeURIComponent(photoKey).split('/').pop() : '') ||
    'Untitled';

  const [title, setTitle] = useState<string>(initialTitle);
  const [description, setDescription] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [holiday, setHoliday] = useState<string>('');
  const [tagsText, setTagsText] = useState<string>(''); // comma-separated
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const canSubmit = !!photoKey && title.trim().length > 0 && !saving;

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  async function onSubmit() {
    setError('');
    if (!photoKey) {
      setError('Missing photoKey. Go back to Photos and pick a photo again.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    try {
      ensureAmplifyConfigured();

      const payload: CreatePayload = {
        photoKey,
        title: title.trim(),
      };

      const d = description.trim();
      if (d) payload.description = d;

      if (room) payload.room = room;
      if (holiday) payload.holiday = holiday;

      const tags = parseTags(tagsText);
      if (tags.length) payload.tags = tags;

      await apiFetch(`/families/${familyId}/heirlooms`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // go to heirlooms list
      router.replace('/app/heirlooms');
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Create Heirloom</h1>

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
          ← Back to Photos
        </button>
      </div>

      <p style={{ marginTop: 8, color: '#444' }}>
        Add details for this heirloom. (MVP: hardcoded room/holiday lists + freeform tags.)
      </p>

      {error ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', borderRadius: 12 }}>
          <strong>Error:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Preview */}
        <div
          style={{
            borderRadius: 14,
            border: '1px solid #ddd',
            background: '#fff',
            padding: 12,
          }}
        >
          <div
            style={{
              width: '100%',
              height: 200,
              borderRadius: 10,
              background: '#f3f3f3',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={title || 'Selected photo'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#888', fontSize: 12 }}>No preview URL</span>
            )}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: '#333', wordBreak: 'break-all' }}>
            <strong>photoKey:</strong> {photoKey || '(missing)'}
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            borderRadius: 14,
            border: '1px solid #ddd',
            background: '#fff',
            padding: 16,
          }}
        >
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#222' }}>
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Dad’s Watch"
            style={{
              width: '100%',
              marginTop: 6,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #ccc',
              outline: 'none',
              fontSize: 14,
            }}
          />

          <label style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 600, color: '#222' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell the story. Why does it matter?"
            rows={5}
            style={{
              width: '100%',
              marginTop: 6,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #ccc',
              outline: 'none',
              fontSize: 14,
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#222' }}>
                Room
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #ccc',
                  background: '#fff',
                  fontSize: 14,
                }}
              >
                <option value="">(none)</option>
                {ROOMS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#222' }}>
                Holiday / Occasion
              </label>
              <select
                value={holiday}
                onChange={(e) => setHoliday(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #ccc',
                  background: '#fff',
                  fontSize: 14,
                }}
              >
                <option value="">(none)</option>
                {HOLIDAYS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 600, color: '#222' }}>
            Tags (comma-separated)
          </label>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="e.g., jewelry, 1998, grandma"
            style={{
              width: '100%',
              marginTop: 6,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #ccc',
              outline: 'none',
              fontSize: 14,
            }}
          />

          <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #0a7',
                background: canSubmit ? '#0a7' : '#ddd',
                color: canSubmit ? '#fff' : '#666',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Creating…' : 'Create Heirloom'}
            </button>

            <button
              onClick={() => router.push('/app')}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #999',
                background: '#fff',
                color: '#111',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            {!photoKey ? (
              <span style={{ marginLeft: 'auto', color: '#b00', fontSize: 12 }}>
                Missing photoKey (open from Photos page)
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}