'use client';

import { useEffect, useState } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';

/**
 * NOTE:
 * - In Amplify v6, the Hosted UI redirect flow is completed by the OAuth listener.
 * - fetchAuthSession() can hang if the exchange never completes.
 * - We hard-timeout and show actionable diagnostics instead of freezing forever.
 */

function withTimeout<T>(p: Promise<T>, ms = 20000, label = 'operation'): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms during ${label}`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

/**
 * Manual fallback token exchange for auth code + PKCE.
 * This ONLY works if we can read the PKCE code_verifier that Amplify stored.
 * If the verifier is missing, we fail with a clear message.
 */
async function manualTokenExchange(code: string) {
  // We intentionally read from env (same as amplifyClient.ts),
  // because aws-exports may contain multiple redirect URIs.
  const domainRaw = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '';
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

  const domain = stripProtocol(domainRaw);
  const redirectUri = `${window.location.origin}/auth/callback`;

  if (!domain || !clientId) {
    throw new Error(
      `Manual exchange missing env: domain=${domainRaw || '(empty)'} clientId=${clientId || '(empty)'}`
    );
  }

  // Try common PKCE verifier keys (Amplify has changed these across versions)
  const verifier =
    sessionStorage.getItem('amplify-pkce-code-verifier') ||
    sessionStorage.getItem('amplify-signin-with-redirect-code-verifier') ||
    sessionStorage.getItem('pkce_code_verifier') ||
    '';

  if (!verifier) {
    throw new Error(
      `PKCE code_verifier not found in sessionStorage. Manual token exchange cannot proceed. ` +
        `This usually means the redirect was initiated in a different tab/session, ` +
        `or storage was cleared, or the listener never wrote it.`
    );
  }

  const tokenUrl = `https://${domain}/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${JSON.stringify(json)}`);
  }

  // Store tokens in the legacy keys your app has used historically (if any code still expects them)
  if (json.access_token) localStorage.setItem('heirloom_access_token', json.access_token);
  if (json.id_token) localStorage.setItem('heirloom_id_token', json.id_token);
  if (json.refresh_token) localStorage.setItem('heirloom_refresh_token', json.refresh_token);
  if (json.expires_in != null) localStorage.setItem('heirloom_expires_in', String(json.expires_in));
}

export default function CallbackPage() {
  const [status, setStatus] = useState('Starting sign-in…');
  const [detail, setDetail] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        ensureAmplifyConfigured();

        const url = new URL(window.location.href);
        const err = url.searchParams.get('error');
        const errDesc = url.searchParams.get('error_description');

        if (err) {
          setStatus('Sign-in failed (Cognito returned an error).');
          setDetail(`${err}: ${errDesc ?? ''}`);
          return;
        }

        const code = url.searchParams.get('code');
        if (!code) {
          setStatus('Missing ?code= on callback URL.');
          setDetail('No authorization code found. Try signing in again from /login.');
          return;
        }

        // 1) Preferred path: let Amplify OAuth listener finish the exchange.
        setStatus('Completing sign-in (Amplify fetchAuthSession)…');
        try {
          await withTimeout(fetchAuthSession({ forceRefresh: true }), 20000, 'fetchAuthSession');
          await withTimeout(getCurrentUser(), 20000, 'getCurrentUser');

          setStatus('Signed in ✅ Redirecting…');
          window.location.replace('/app');
          return;
        } catch (e: any) {
          // 2) Fallback: try manual exchange (only works if PKCE verifier is present)
          setStatus('Amplify exchange failed — trying manual token exchange…');
          await manualTokenExchange(code);

          // If manual exchange worked, we can proceed
          setStatus('Signed in ✅ Redirecting…');
          window.location.replace('/app');
          return;
        }
      } catch (e: any) {
        setStatus('Sign-in failed.');
        setDetail(String(e?.message ?? e));
      }
    })();
  }, []);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>{status}</p>
      {detail ? (
        <>
          <p style={{ marginTop: 12, fontWeight: 600 }}>Details:</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{detail}</pre>
          <p style={{ marginTop: 16 }}>
            Quick recovery steps:
            <br />• Go back to <code>/login</code> and sign in again
            <br />• Try in an incognito/private window
            <br />• Ensure Amplify env vars are set in Amplify Console (not only .env.local)
          </p>
        </>
      ) : null}
    </main>
  );
}