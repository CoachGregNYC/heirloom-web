// app/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, fetchAuthSession } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';
import { useMe } from '@/app/useMe';

type PhotoItem = {
  key: string;
  url?: string;
  filename?: string;
  lastModified?: string;
  size?: number;
  assigned?: boolean;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Lato:wght@300;400;700&display=swap');
  .heirloom-root { font-family: 'Lato', sans-serif; background: #f8f6f1; min-height: 100vh; color: #1a1a2e; }
  .heirloom-header { position: sticky; top: 0; z-index: 100; background: #1a2744; padding: 0 32px; border-bottom: 1px solid #2d3d6b; }
  .heirloom-header-top { display: flex; align-items: center; gap: 16px; padding: 14px 0 10px; }
  .heirloom-logo { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; color: #f0e6c8; margin: 0; letter-spacing: 0.5px; }
  .heirloom-nav-btn { padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(240,230,200,0.3); background: transparent; color: #c8d8f0; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; letter-spacing: 0.5px; transition: all 0.2s; }
  .heirloom-nav-btn:hover { background: rgba(240,230,200,0.1); border-color: rgba(240,230,200,0.5); }
  .heirloom-signout-btn { margin-left: auto; padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(240,230,200,0.2); background: transparent; color: #a0b0c8; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; transition: all 0.2s; }
  .heirloom-signout-btn:hover { background: rgba(255,255,255,0.05); color: #c8d8f0; }
  .heirloom-email { font-size: 12px; color: #7a8fa8; letter-spacing: 0.3px; }
  .heirloom-subtitle { font-family: 'Playfair Display', serif; font-size: 13px; color: #c8a96e; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 12px; margin: 0; }
  .heirloom-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 14px 32px; background: #f8f6f1; border-bottom: 1px solid #e8e0d0; }
  .heirloom-refresh-btn { padding: 9px 20px; border-radius: 6px; border: 1px solid #1a2744; background: #1a2744; color: #f0e6c8; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; letter-spacing: 0.5px; transition: all 0.2s; }
  .heirloom-refresh-btn:hover { background: #2d3d6b; }
  .heirloom-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .heirloom-create-btn { padding: 9px 20px; border-radius: 6px; border: 1px solid #b8960c; background: #c8a96e; color: #1a1a2e; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; transition: all 0.2s; }
  .heirloom-create-btn:hover:not(:disabled) { background: #b8960c; color: #fff; }
  .heirloom-create-btn:disabled { background: #e0d8c8; border-color: #d0c8b8; color: #a09080; cursor: not-allowed; }
  .heirloom-selection-text { font-size: 13px; color: #6a7a8a; font-style: italic; letter-spacing: 0.3px; }
  .heirloom-grid-container { padding: 24px 32px 40px; }
  .heirloom-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 16px; }
  .heirloom-photo-card { text-align: left; border-radius: 8px; border: 2px solid transparent; background: #fff; padding: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 4px rgba(26,39,68,0.08); }
  .heirloom-photo-card:hover { box-shadow: 0 4px 12px rgba(26,39,68,0.15); transform: translateY(-1px); }
  .heirloom-photo-card.selected { border-color: #c8a96e; box-shadow: 0 0 0 3px rgba(200,169,110,0.2); }
  .heirloom-photo-thumb { width: 100%; height: 130px; border-radius: 6px; background: #f0ebe0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .heirloom-photo-label { margin-top: 8px; font-size: 11px; color: #6a7a8a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.2px; }
  .heirloom-delete-btn { margin-top: 6px; width: 100%; padding: 5px 0; border-radius: 4px; border: 1px solid #f0c8c8; background: #fff; color: #a03030; cursor: pointer; font-size: 11px; font-family: 'Lato', sans-serif; letter-spacing: 0.3px; transition: all 0.2s; }
  .heirloom-delete-btn:hover:not(:disabled) { background: #fff0f0; border-color: #e09090; }
  .heirloom-error { margin: 12px 32px; padding: 14px 18px; border: 1px solid #f0c8c8; border-radius: 8px; background: #fff8f8; color: #a03030; font-size: 14px; }
  .heirloom-empty { margin-top: 40px; text-align: center; color: #9a8a7a; font-family: 'Playfair Display', serif; font-style: italic; font-size: 16px; }
  .heirloom-divider { width: 40px; height: 1px; background: #c8a96e; margin: 8px auto 0; }
`;

export default function AppHome() {
  const router = useRouter();
  const { me, loading: meLoading, error: meError, refresh: refreshMe } = useMe();
  const familyId = me?.familyId || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selected, setSelected] = useState<PhotoItem[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [deletingPhoto, setDeletingPhoto] = useState<string>('');

  async function loadPhotos(fid: string) {
    setError('');
    setLoading(true);
    try {
      ensureAmplifyConfigured();
      const data = await apiFetch(`/families/${fid}/photos`, { method: 'GET' });
      const items: PhotoItem[] = Array.isArray(data) ? data : data?.items ?? [];
      setPhotos(items);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function onDeletePhoto(p: PhotoItem) {
    const ok = window.confirm(`Delete photo "${p.filename ?? p.key}"? This cannot be undone.`);
    if (!ok) return;
    setDeletingPhoto(p.key);
    try {
      ensureAmplifyConfigured();
      const encodedKey = encodeURIComponent(p.key);
      await apiFetch(`/families/${familyId}/photos?photoKey=${encodedKey}`, { method: 'DELETE' });
      setPhotos(prev => prev.filter(x => x.key !== p.key));
      setSelected(prev => prev.filter(x => x.key !== p.key));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setDeletingPhoto('');
    }
  }

  async function onCreateHeirloom() {
    if (!selected.length) return;
    const primary = selected[0];
    const filename = primary.filename ?? primary.key.split('/').pop() ?? '';
    const photoUrl = primary.url ?? '';
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('heirloom_selected_photoKey', primary.key);
      window.sessionStorage.setItem('heirloom_selected_photoUrl', photoUrl);
      window.sessionStorage.setItem('heirloom_selected_filename', filename);
      window.sessionStorage.setItem('heirloom_selected_photoKeys', JSON.stringify(selected.map(p => p.key)));
      window.sessionStorage.setItem('heirloom_selected_photoUrls', JSON.stringify(selected.map(p => p.url ?? '')));
    }
    const qs = new URLSearchParams({ photoKey: primary.key, photoUrl, filename });
    router.push(`/app/heirlooms/create?${qs.toString()}`);
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
    ensureAmplifyConfigured();
    fetchAuthSession().then(session => {
      const email = session.tokens?.idToken?.payload?.email as string ?? '';
      setUserEmail(email);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (meLoading) return;
    if (meError) throw new Error(meError);
    if (!familyId) throw new Error('Missing familyId from /me (membership not found).');
    loadPhotos(familyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, familyId]);

  const effectiveError = meError || error;

  return (
    <>
      <style>{styles}</style>
      <main className="heirloom-root">
        <header className="heirloom-header">
          <div className="heirloom-header-top">
            <h1 className="heirloom-logo">Heirloom</h1>
            <button className="heirloom-nav-btn" onClick={() => router.push('/app/heirlooms')}>
              Heirlooms →
            </button>
            <button className="heirloom-signout-btn" onClick={onSignOut}>Sign out</button>
            {userEmail && <span className="heirloom-email">{userEmail}</span>}
          </div>
          <p className="heirloom-subtitle">
            {me?.familyName ? `${me.familyName} Family · Filing Cabinet` : 'Family Filing Cabinet'}
          </p>
        </header>

        {effectiveError ? (
          <div className="heirloom-error">
            <strong>Error:</strong> {effectiveError}
            {meError && (
              <button onClick={refreshMe} style={{ marginLeft: 12, padding: '4px 12px', borderRadius: 4, border: '1px solid #a03030', background: 'transparent', color: '#a03030', cursor: 'pointer', fontSize: 12 }}>
                Retry
              </button>
            )}
          </div>
        ) : null}

        <div className="heirloom-toolbar">
          <button className="heirloom-refresh-btn" onClick={() => familyId && loadPhotos(familyId)} disabled={loading || meLoading || !familyId}>
            {loading || meLoading ? 'Loading…' : 'Refresh'}
          </button>
          {me?.role !== 'Viewer' && (
            <button className="heirloom-create-btn" onClick={onCreateHeirloom} disabled={!selected.length}>
              Create Heirloom from Selected
            </button>
          )}
          <span className="heirloom-selection-text">
            {selected.length ? `${selected.length} photo${selected.length > 1 ? 's' : ''} selected` : 'Tap photos to select'}
          </span>
        </div>

        <div className="heirloom-grid-container">
          <div className="heirloom-grid">
            {photos.filter(p => !p.assigned).map((p) => {
              const isSelected = selected.some(x => x.key === p.key);
              const isAdmin = me?.role === 'Admin' || me?.role === 'Owner';
              const thumb = p.url;
              const label = p.filename ?? p.key.split('/').pop() ?? p.key;
              return (
                <button
                  key={p.key}
                  className={`heirloom-photo-card${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelected(prev => prev.find(x => x.key === p.key) ? prev.filter(x => x.key !== p.key) : [...prev, p])}
                >
                  <div className="heirloom-photo-thumb">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#a09080', fontSize: 12, fontStyle: 'italic' }}>No preview</span>
                    )}
                  </div>
                  {isAdmin && (
                    <button className="heirloom-delete-btn" onClick={(e) => { e.stopPropagation(); onDeletePhoto(p); }} disabled={deletingPhoto === p.key}>
                      {deletingPhoto === p.key ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                  <div className="heirloom-photo-label">{label}</div>
                </button>
              );
            })}
          </div>
          {!meLoading && !loading && photos.filter(p => !p.assigned).length === 0 && (
            <div className="heirloom-empty">
              <p>No photos in the filing cabinet yet.</p>
              <div className="heirloom-divider" />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
