'use client';

import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);

  const s = String(v).trim();
  if (!s) return [];
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function pickBestSingle(urls: string[]): string {
  if (urls.length === 0) return '';
  if (typeof window === 'undefined') return urls[0];

  const origin = window.location.origin;
  const match = urls.find((u) => u.startsWith(origin));
  return match ?? urls[0];
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  const oauthLegacy = cfg.oauth ?? {};

  const domain = stripProtocol(String(oauthLegacy.domain ?? ''));
  const redirectSignInSingle = pickBestSingle(toStringArray(oauthLegacy.redirectSignIn));
  const redirectSignOutSingle = pickBestSingle(toStringArray(oauthLegacy.redirectSignOut));

  // IMPORTANT: v6 expects string[] for redirects
  const redirectSignIn = redirectSignInSingle ? [redirectSignInSingle] : [];
  const redirectSignOut = redirectSignOutSingle ? [redirectSignOutSingle] : [];

  const amplifyV6Config: any = {
    Auth: {
      Cognito: {
        userPoolId: cfg.aws_user_pools_id,
        userPoolClientId: cfg.aws_user_pools_web_client_id,
        identityPoolId: cfg.aws_cognito_identity_pool_id,
        loginWith: {
          oauth: {
            domain,
            scopes: oauthLegacy.scope ?? ['openid', 'email', 'profile'],
            redirectSignIn,
            redirectSignOut,
            responseType: oauthLegacy.responseType ?? 'code',
          },
        },
      },
    },
  };

  // Debug: these should be NON-empty in browser
  // eslint-disable-next-line no-console
  console.log('[Amplify v6] oauth domain:', domain);
  // eslint-disable-next-line no-console
  console.log('[Amplify v6] redirectSignIn:', redirectSignIn);
  // eslint-disable-next-line no-console
  console.log('[Amplify v6] redirectSignOut:', redirectSignOut);

  Amplify.configure(amplifyV6Config);

  configured = true;
}