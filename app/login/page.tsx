'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import awsExportsRaw from '../../aws-exports';

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

function base64UrlEncode(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomString(len = 64): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  // base64url-ish
  return base64UrlEncode(arr.buffer);
}

async function sha256(input: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder().encode(input);
  return crypto.subtle.digest('SHA-256', enc);
}

function getCfg() {
  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;
  const oauth = cfg?.oauth ?? {};
  const domain = stripProtocol(String(oauth.domain ?? ''));
  const clientId = String(cfg?.aws_user_pools_web_client_id ?? '');
  const scopeArr: string[] = Array.isArray(oauth.scope) ? oauth.scope : ['openid', 'email', 'profile'];

  // IMPORTANT: use the runtime origin redirect, not “localhost first”
  const redirectUri = pickOneRedirect(oauth.redirectSignIn) || `${window.location.origin}/auth/callback`;

  return { domain, clientId, scopeArr, redirectUri };
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If tokens already present, skip login
    const idToken = localStorage.getItem('heirloom_id_token');
    const accessToken = localStorage.getItem('heirloom_access_token');
    if (idToken && accessToken) router.replace('/app');
  }, [router]);

  const onSignIn = async () => {
    const { domain, clientId, scopeArr, redirectUri } = getCfg();

    if (!domain || !clientId) {
      alert('Missing Cognito domain or client id in aws-exports.js');
      return;
    }

    // PKCE
    const verifier = randomString(64);
    const challenge = base64UrlEncode(await sha256(verifier));
    const state = randomString(32);

    sessionStorage.setItem('heirloom_pkce_verifier', verifier);
    sessionStorage.setItem('heirloom_pkce_state', state);

    const authorizeUrl =
      `https://${domain}/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopeArr.join(' '))}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&code_challenge=${encodeURIComponent(challenge)}` +
      `&code_challenge_method=S256`;

    window.location.href = authorizeUrl;
  };

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>Preserve what matters. Private, secure, family-first.</p>

      <button
        onClick={onSignIn}
        style={{
          marginTop: 24,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid #111',
          background: '#111',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Sign in
      </button>
    </main>
  );
}