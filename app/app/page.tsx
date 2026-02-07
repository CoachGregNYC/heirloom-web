'use client';

import React, { useEffect, useMemo, useState } from 'react';

// If you're using Amplify Storage v6 style imports, keep these.
// If your current code imports differently, tell me what you're using and I’ll adjust.
import { list, getUrl } from 'aws-amplify/storage';

type Item = {
  key: string;
  url: string;
};

export default function AppHomePage() {
  const [mounted, setMounted] = useState(false);

  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<Item[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Folder you want to browse in the Amplify Storage bucket
  const prefix = useMemo(
    () => 'protected/family-filing-cabinet/originals/',
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // IMPORTANT: nothing in this effect runs during build/prerender,
    // so it's safe to touch localStorage / window here.
    async function run() {
      try {
        setError(null);
        setLoading(true);

        const idToken =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('heirloom_id_token')
            : null;

        const accessToken =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('heirloom_access_token')
            : null;

        const isAuthed = Boolean(idToken && accessToken);
        setSignedIn(isAuthed);

        if (!isAuthed) {
          // Not signed in: don't try to hit S3
          setItems([]);
          setLoading(false);
          return;
        }

        // List objects in protected folder
        const res = await list({
          path: prefix,
          options: {
            // if you later add pagination, Amplify returns nextToken
            // you can handle that here
          },
        });

        // Some objects may be "folder markers" or empty keys; filter safely
        const keys = (res.items ?? [])
          .map((x) => x.path)
          .filter((k): k is string => Boolean(k) && !k.endsWith('/'));

        // Build signed URLs
        const urls: Item[] = [];
        for (const key of keys) {
          const u = await getUrl({
            path: key,
            options: {
              // keep short TTL; you can change later
              expiresIn: 60 * 5,
            },
          });

          urls.push({
            key,
            url: u.url.toString(),
          });
        }

        setItems(urls);
        setLoading(false);
      } catch (e: any) {
        setLoading(false);
        setError(e?.message ?? String(e));
      }
    }

    // Only run after mount so no build-time weirdness.
    if (mounted) run();
  }, [mounted, prefix]);

  function buildHostedLogoutUrl() {
    // Use the env vars you already set in Amplify Hosting → Environment variables
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI;

    if (!domain || !clientId || !logoutUri) return null;

    const base = domain.replace(/\/$/, '');
    const u = new URL(`${base}/logout`);
    u.searchParams.set('client_id', clientId);
    u.searchParams.set('logout_uri', logoutUri);
    return u.toString();
  }

  function signOut() {
    try {
      window.localStorage.removeItem('heirloom_id_token');
      window.localStorage.removeItem('heirloom_access_token');
      window.localStorage.removeItem('heirloom_refresh_token');
      window.localStorage.removeItem('heirloom_expires_in');
    } catch {}

    const url = buildHostedLogoutUrl();
    if (url) {
      window.location.href = url;
      return;
    }

    // fallback
    window.location.href = '/';
  }

  // Render guard: during prerender/build, mounted is false
  if (!mounted) {
    return (
      <main style={{ padding: 32, fontFamily: 'system-ui' }}>
        <h1>Heirloom</h1>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>

      {signedIn ? (
        <p style={{ marginTop: 0 }}>
          ✅ <strong>Signed in.</strong>
        </p>
      ) : (
        <p style={{ marginTop: 0 }}>
          ⚠️ <strong>Not signed in.</strong> Go to the home page and click “Sign in”.
        </p>
      )}

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <button
          onClick={signOut}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>

      <div
        style={{
          padding: 16,
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          marginBottom: 16,
          maxWidth: 900,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Family Filing Cabinet
        </div>
        <div style={{ color: '#444' }}>
          Browsing: <code>{prefix}</code>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            border: '1px solid #f5c2c7',
            background: '#f8d7da',
            borderRadius: 10,
            maxWidth: 900,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      )}

      {loading && <p>Loading photos…</p>}

      {!loading && signedIn && items.length === 0 && !error && (
        <p>
          No photos found under <code>{prefix}</code>.
          <br />
          Confirm the objects are uploaded to that exact path in S3.
        </p>
      )}

      {!loading && items.length > 0 && (
        <>
          <div style={{ marginBottom: 10 }}>
            {selectedKey ? (
              <>
                Selected: <code>{selectedKey}</code>
              </>
            ) : (
              <>Select a photo to create a new Heirloom.</>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
              maxWidth: 1100,
            }}
          >
            {items.map((it) => {
              const selected = selectedKey === it.key;
              return (
                <button
                  key={it.key}
                  onClick={() => setSelectedKey(it.key)}
                  style={{
                    border: selected ? '2px solid #111' : '1px solid #ddd',
                    borderRadius: 12,
                    padding: 8,
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <img
                    src={it.url}
                    alt={it.key}
                    style={{
                      width: '100%',
                      height: 140,
                      objectFit: 'cover',
                      borderRadius: 10,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: '#444',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={it.key}
                  >
                    {it.key.replace(prefix, '')}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}