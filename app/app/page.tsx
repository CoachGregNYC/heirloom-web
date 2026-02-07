'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// Amplify Gen2 outputs file is typically at repo root.
// From app/app/page.tsx, "../../amplify_outputs.json" is the correct relative path.
import outputs from '../../amplify_outputs.json';

import { Amplify } from 'aws-amplify';
import { list, getUrl } from 'aws-amplify/storage';

type GalleryItem = {
  key: string;        // full storage key/path
  name: string;       // filename
  url: string;        // signed URL
};

const STORAGE_PREFIX = 'protected/family-filing-cabinet/originals/';

function ensureAmplifyConfigured() {
  // Avoid double-configure in dev/hot reload.
  const g = globalThis as any;
  if (g.__heirloomAmplifyConfigured) return;

  Amplify.configure(outputs);
  g.__heirloomAmplifyConfigured = true;
}

export default function AppHomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const cfg = useMemo(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI;
    return { domain, clientId, logoutUri };
  }, []);

  // Basic gate: if no token, send to /login
  useEffect(() => {
    const access = localStorage.getItem('heirloom_access_token');
    const idt = localStorage.getItem('heirloom_id_token');

    if (!access || !idt) {
      router.replace('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        ensureAmplifyConfigured();

        // List objects under the protected prefix
        const res = await list({
          path: STORAGE_PREFIX,
          options: {
            // listAll is helpful if you upload more than 1 page worth later
            listAll: true,
          },
        });

        // Filter to files (Amplify can return "folders" too)
        const files = (res.items ?? []).filter((x: any) => {
          const p = x?.path ?? x?.key ?? '';
          return p && !String(p).endsWith('/');
        });

        // Build signed URLs for display
        const gallery: GalleryItem[] = [];
        for (const f of files) {
          const key = (f as any).path ?? (f as any).key;
          if (!key) continue;

          const filename = String(key).split('/').pop() || String(key);

          const signed = await getUrl({
            path: key,
            options: {
              // 15 minutes is plenty for viewing
              expiresIn: 60 * 15,
            },
          });

          gallery.push({
            key: String(key),
            name: filename,
            url: signed.url.toString(),
          });
        }

        // Sort newest-ish by name (we’ll improve later with metadata)
        gallery.sort((a, b) => a.name.localeCompare(b.name));

        setItems(gallery);
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error loading Family Filing Cabinet');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function signOut() {
    // Clear local session
    localStorage.removeItem('heirloom_id_token');
    localStorage.removeItem('heirloom_access_token');
    localStorage.removeItem('heirloom_refresh_token');
    localStorage.removeItem('heirloom_expires_in');

    const { domain, clientId, logoutUri } = cfg;

    // If env vars exist, sign out of Cognito hosted UI too
    if (domain && clientId && logoutUri) {
      const base = domain.replace(/\/$/, '');
      const url =
        `${base}/logout` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&logout_uri=${encodeURIComponent(logoutUri)}`;

      window.location.href = url;
      return;
    }

    // Fallback
    router.replace('/login');
  }

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Heirloom</h1>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Family Filing Cabinet → <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{STORAGE_PREFIX}</span>
          </p>
        </div>

        <button
          onClick={signOut}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.15)',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </header>

      <section
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 14,
          border: '1px solid rgba(0,0,0,0.12)',
          background: 'rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700 }}>✅ Signed in.</div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              Choose a photo below. Next we’ll turn the selected photo into a full Heirloom entry.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{items.length} photo(s)</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>{loading ? 'Loading…' : 'Ready'}</div>
          </div>
        </div>
      </section>

      {error && (
        <section style={{ marginTop: 18 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              border: '1px solid rgba(255,0,0,0.25)',
              background: 'rgba(255,0,0,0.06)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Error loading photos</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
          </div>
        </section>
      )}

      <section style={{ marginTop: 22 }}>
        {loading ? (
          <p>Loading your Family Filing Cabinet photos…</p>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              border: '1px dashed rgba(0,0,0,0.25)',
              background: 'rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No photos found yet.</div>
            <div style={{ opacity: 0.85 }}>
              Upload images to:
              <div style={{ marginTop: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                {STORAGE_PREFIX}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              {items.map((it) => {
                const isSelected = selected?.key === it.key;

                return (
                  <button
                    key={it.key}
                    onClick={() => setSelected(it)}
                    style={{
                      textAlign: 'left',
                      padding: 0,
                      borderRadius: 14,
                      border: isSelected ? '2px solid rgba(0,0,0,0.7)' : '1px solid rgba(0,0,0,0.12)',
                      background: 'white',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
                    }}
                    title={it.name}
                  >
                    <div style={{ aspectRatio: '4 / 3', background: 'rgba(0,0,0,0.04)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.url}
                        alt={it.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        {isSelected ? 'Selected' : 'Click to select'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ opacity: 0.85 }}>
                {selected ? (
                  <>
                    Selected: <span style={{ fontWeight: 700 }}>{selected.name}</span>
                  </>
                ) : (
                  'Select a photo to begin creating an Heirloom entry.'
                )}
              </div>

              <button
                disabled={!selected}
                onClick={() => {
                  // Next step: build /app/heirlooms/new that pre-fills selected image
                  alert('Next step: Create Heirloom entry from selected photo (we build this next).');
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: selected ? 'white' : 'rgba(0,0,0,0.04)',
                  cursor: selected ? 'pointer' : 'not-allowed',
                  opacity: selected ? 1 : 0.6,
                }}
              >
                Create Heirloom from selected photo
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}