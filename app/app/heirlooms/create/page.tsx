'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { getFamilyId } from '@/app/family';

const ROOM_OPTIONS = ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Storage', 'Other'];
const HOLIDAY_OPTIONS = ['None', 'Christmas', 'Thanksgiving', 'Easter', 'Halloween', 'Birthday', 'Other'];
const TAG_OPTIONS = ['Antique', 'Inherited', 'Fragile', 'Document', 'Artwork', 'Furniture', 'Sentimental'];

export default function CreateHeirloomPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const familyId = useMemo(() => getFamilyId(), []);

  const photoKey = sp.get('photoKey') || '';
  const filename = sp.get('filename') || '';
  const url = sp.get('url') || '';

  const [title, setTitle] = useState(filename || 'Untitled');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState(ROOM_OPTIONS[0]);
  const [holiday, setHoliday] = useState(HOLIDAY_OPTIONS[0]);
  const [tags, setTags] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function onSave() {
    setError('');

    if (!photoKey) {
      setError('Missing photoKey. Go back and select a photo again.');
      return;
    }

    setSaving(true);

    try {
      ensureAmplifyConfigured();

      const payload = {
        photoKey,
        title: title.trim() || 'Untitled',
        description: description.trim() || undefined,
        room,
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

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 900 }}>
      <h1>Create Heirloom</h1>

      {error && (
        <div style={{ marginBottom: 12, color: 'red' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Selected photo</div>
          <div style={{ marginTop: 8 }}>
            {url ? (
              <img src={url} alt={filename} style={{ width: '100%' }} />
            ) : (
              <div>No preview</div>
            )}
          </div>
        </div>

        <div>
          <label>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', marginBottom: 12 }}
          />

          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', minHeight: 100, marginBottom: 12 }}
          />

          <label>Room</label>
          <select value={room} onChange={(e) => setRoom(e.target.value)}>
            {ROOM_OPTIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>

          <br /><br />

          <label>Holiday</label>
          <select value={holiday} onChange={(e) => setHoliday(e.target.value)}>
            {HOLIDAY_OPTIONS.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>

          <br /><br />

          <label>Tags</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {TAG_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 20,
                  border: '1px solid #ccc',
                  background: tags.includes(t) ? '#0a7' : '#fff',
                  color: tags.includes(t) ? '#fff' : '#000',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <br />

          <button onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Heirloom'}
          </button>
        </div>
      </div>
    </main>
  );
}