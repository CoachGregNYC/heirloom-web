'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { useMe } from '@/app/useMe';

type CreateHeirloomBody = {
  photoKey: string;
  photoKeys: string[];
  title?: string;
  description?: string;
  room?: string;
  holiday?: string;
  tags?: string[];
};

const SESSION_KEY_PHOTO_KEY = 'heirloom.create.photoKey';
const SESSION_KEY_PHOTO_URL = 'heirloom.create.photoUrl';
const SESSION_KEY_FILENAME = 'heirloom.create.filename';

function safeTrim(v?: string | null) {
  return (v ?? '').trim();
}

function readQueryParam(name: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const sp = new URLSearchParams(window.location.search);
    return safeTrim(sp.get(name));
  } catch {
    return '';
  }
}

export default function CreateHeirloomClient({
  initialPhotoKey,
  initialPhotoUrl,
  initialFilename,
}: {
  initialPhotoKey: string;
  initialPhotoUrl?: string;
  initialFilename?: string;
}) {
  const router = useRouter();
  const { me, loading: meLoading, error: meError, refresh: refreshMe } = useMe();
  const familyId = me?.familyId || '';

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [photoKey, setPhotoKey] = useState<string>('');
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [filename, setFilename] = useState<string>('');

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [room, setRoom] = useState<string>('Living Room');
  const [holiday, setHoliday] = useState<string>('None');
  const [tags, setTags] = useState<string[]>(['Photo']);

  const resolvedInitialPhotoKey = useMemo(() => safeTrim(initialPhotoKey), [initialPhotoKey]);
  const resolvedInitialPhotoUrl = useMemo(() => safeTrim(initialPhotoUrl), [initialPhotoUrl]);
  const resolvedInitialFilename = useMemo(() => safeTrim(initialFilename), [initialFilename]);

  // Resolve (robustly) from:
  // 1) server-passed props (searchParams -> page.tsx)
  // 2) browser URL (in case props are missing / route got weird)
  // 3) sessionStorage fallback (in case query string is huge/truncated)
  useEffect(() => {
    const fromPropsKey = resolvedInitialPhotoKey;
    const fromUrlKey = readQueryParam('photoKey');
    const fromSessionKey =
      typeof window !== 'undefined' ? safeTrim(window.sessionStorage.getItem(SESSION_KEY_PHOTO_KEY)) : '';

    const chosenKey = safeTrim(fromPropsKey || fromUrlKey || fromSessionKey);
    setPhotoKey(chosenKey);

    const fromPropsUrl = resolvedInitialPhotoUrl;
    const fromUrlUrl = readQueryParam('photoUrl');
    const fromSessionUrl =
      typeof window !== 'undefined' ? safeTrim(window.sessionStorage.getItem(SESSION_KEY_PHOTO_URL)) : '';
    const chosenUrl = safeTrim(fromPropsUrl || fromUrlUrl || fromSessionUrl);
    setPhotoUrl(chosenUrl);

    const fromPropsFilename = resolvedInitialFilename;
    const fromUrlFilename = readQueryParam('filename');
    const fromSessionFilename =
      typeof window !== 'undefined' ? safeTrim(window.sessionStorage.getItem(SESSION_KEY_FILENAME)) : '';
    const chosenFilename = safeTrim(fromPropsFilename || fromUrlFilename || fromSessionFilename);
    setFilename(chosenFilename);

    // Load multi-photo selections
    if (typeof window !== 'undefined') {
      try {
        const keys = JSON.parse(window.sessionStorage.getItem('heirloom_selected_photoKeys') || '[]');
        const urls = JSON.parse(window.sessionStorage.getItem('heirloom_selected_photoUrls') || '[]');
        console.log("loaded photoKeys:", keys, "photoUrls count:", urls.length); if (keys.length) { setPhotoKeys(keys); setPhotoUrls(urls); }
      } catch {}
    }

    // Persist for refresh safety
    if (typeof window !== 'undefined') {
      if (chosenKey) window.sessionStorage.setItem(SESSION_KEY_PHOTO_KEY, chosenKey);
      if (chosenUrl) window.sessionStorage.setItem(SESSION_KEY_PHOTO_URL, chosenUrl);
      if (chosenFilename) window.sessionStorage.setItem(SESSION_KEY_FILENAME, chosenFilename);
    }

    // Auto-title if blank
    if (!safeTrim(title) && chosenFilename) {
      setTitle(chosenFilename);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedInitialPhotoKey, resolvedInitialPhotoUrl, resolvedInitialFilename]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(SESSION_KEY_PHOTO_KEY);
    window.sessionStorage.removeItem(SESSION_KEY_PHOTO_URL);
    window.sessionStorage.removeItem(SESSION_KEY_FILENAME);
  }, []);

  async function onSubmit() {
    setError('');
    setSaving(true);

    try {
      ensureAmplifyConfigured();

      const pk = safeTrim(photoKey);
      if (!pk) {
        throw new Error('Missing photoKey. Go back to Photos and select a photo again.');
      }

      if (!familyId) {
        throw new Error('Missing familyId from /me. Add membership row for this userSub.');
      }

      const body: CreateHeirloomBody = {
        photoKey: pk,
        photoKeys: photoKeys.length ? photoKeys : [pk],
        title: safeTrim(title) || undefined,
        description: safeTrim(description) || undefined,
        room: room || undefined,
        holiday: holiday || undefined,
        tags: tags.length ? tags : undefined,
      };

      await apiFetch(`/families/${familyId}/heirlooms`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      clearDraft();
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
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#333' }}>Selected photo</div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(photoUrls.length ? photoUrls : [photoUrl]).filter(Boolean).map((url, i) => (
                <div key={i} style={{
                  width: 140, height: 140, borderRadius: 10,
                  border: '1px solid #eee', background: '#f6f6f6',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {!photoUrl && !photoUrls.length && (
                <div style={{ color: '#777', fontSize: 12, padding: 12 }}>No preview available.</div>
              )}
            </div>
            {photoKeys.length > 1 && (
              <div style={{ fontSize: 12, color: '#666' }}>{photoKeys.length} photos selected</div>
            )}

            <div style={{ color: '#666', fontSize: 12 }}>
              <div>
                <strong>photoKey:</strong> <code>{photoKey ? photoKey : '(missing)'}</code>
              </div>
              {filename ? (
                <div style={{ marginTop: 4 }}>
                  <strong>filename:</strong> <code>{filename}</code>
                </div>
              ) : null}
            </div>
          </div>

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