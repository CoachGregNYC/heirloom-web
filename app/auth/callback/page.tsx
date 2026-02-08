'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import awsExportsRaw from '../../../aws-exports';

function pickOneRedirect(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s) return '';
  const urls = s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (typeof window === 'undefined') return urls[0] ?? '';
  const origin = window.location.origin;
  const match = urls.find((u) => u.startsWith(origin));
  return match ?? urls[0] ?? '';
}

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function getCfg() {
  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;
  const oauth = cfg?.oauth ?? {};
  const domain = stripProtocol(String(oauth.domain ?? ''));
  const clientId = String(cfg?.aws_user_pools_web_client_id ?? '');
  const redirectUri = pickOneRedirect(oauth.redirectSignIn) || `${window.location.origin}/auth/callback`;
  return { domain, clientId, redirectUri };
}

export default function CallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Completing sign-in…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (!code) throw new Error('Missing ?code in callback URL.');

        const savedState = sessionStorage.getItem('heirloom_pkce_state');
        const verifier = sessionStorage.getItem('heirloom_pkce_verifier');

        if (!savedState || !verifier) {
          throw new Error('Missing PKCE state/verifier in sessionStorage. Start again from /login.');
        }
        if (!state || state !== savedState) {
          throw new Error('State mismatch. Start again from /login.');
        }

        const { domain, clientId, redirectUri } = getCfg();
        if (!domain || !clientId) throw new Error('Missing Cognito domain or client id.');

        setMsg('Exchanging auth code for tokens…');

        const tokenUrl = `https://${domain}/oauth2/token`;
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
          code_verifier: verifier,
        });

        const resp = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });

        const text = await resp.text();
        if (!resp.ok) {
          throw new Error(`Token exchange failed (${resp.status}): ${text}`);
        }

        const json = JSON.parse(text) as {
          access_token?: string;
          id_token?: string;
          refresh_token?: string;
          expires_in?: number;
          token_type?: string;
        };

        if (!json.access_token || !json.id_token) {
          throw new Error(`Token response missing tokens: ${text}`);
        }

        localStorage.setItem('heirloom_access_token', json.access_token);
        localStorage.setItem('heirloom_id_token', json.id_token);
        if (json.refresh_token) localStorage.setItem('heirloom_refresh_token', json.refresh_token);
        if (json.expires_in != null) localStorage.setItem('heirloom_expires_in', String(json.expires_in));

        // cleanup (optional but recommended)
        sessionStorage.removeItem('heirloom_pkce_state');
        sessionStorage.removeItem('heirloom_pkce_verifier');

        // remove code from URL (prevents replays on refresh)
        window.history.replaceState({}, document.title, '/auth/callback');

        router.replace('/app');
      } catch (e: any) {
        setMsg(e?.message ?? 'Unknown error');
        // Also log for devtools
        console.error('[auth/callback] error:', e);
      }
    })();
  }, [router]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>{msg}</p>
    </main>
  );
}