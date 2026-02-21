'use client';

import 'aws-amplify/auth/enable-oauth-listener';
import { Amplify } from 'aws-amplify';

let configured = false;

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);

  const s = String(v).trim();
  if (!s) return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

function pickRedirectForThisOrigin(all: string[]): string[] {
  // Amplify v6 expects string[]; we pass ONE best match for the current origin
  if (typeof window === 'undefined') return all.slice(0, 1);
  const origin = window.location.origin;
  const match = all.find((u) => u.startsWith(origin));
  return match ? [match] : all.slice(0, 1);
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const domain = stripProtocol(process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '');

  const redirectSignInAll = toStringArray(process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN);
  const redirectSignOutAll = toStringArray(process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT);

  const redirectSignIn = pickRedirectForThisOrigin(redirectSignInAll);
  const redirectSignOut = pickRedirectForThisOrigin(redirectSignOutAll);

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '';
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

  const scopes = ['openid', 'email', 'profile'];
  const responseType = 'code' as const;

  if (!domain || !userPoolId || !clientId || !redirectSignIn.length || !redirectSignOut.length) {
    console.error('OAuth ENV CONFIG MISSING', {
      domain,
      userPoolId,
      clientId,
      redirectSignInAll,
      redirectSignOutAll,
      redirectSignIn,
      redirectSignOut,
    });
    throw new Error('OAuth configuration missing required fields');
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
        loginWith: {
          oauth: {
            domain,
            scopes,
            redirectSignIn,
            redirectSignOut,
            responseType,
          },
        },
      },
    },
  });

  console.log('[Amplify configured]', { domain, redirectSignIn, redirectSignOut });

  configured = true;
}