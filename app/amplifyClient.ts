'use client';

import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);

  const s = String(v).trim();
  if (!s) return [];
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function pickBestRedirect(urls: string[]): string[] {
  // Amplify v6 expects arrays.
  if (!urls.length) return [];
  if (typeof window === 'undefined') return [urls[0]];

  const origin = window.location.origin;
  const match = urls.find(u => u.startsWith(origin));
  return [match ?? urls[0]];
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  const oauth = cfg?.oauth ?? {};
  const domain = stripProtocol(String(oauth.domain ?? ''));

  const redirectInAll = toStringArray(oauth.redirectSignIn);
  const redirectOutAll = toStringArray(oauth.redirectSignOut);

  const redirectSignIn = pickBestRedirect(redirectInAll);
  const redirectSignOut = pickBestRedirect(redirectOutAll);

  // IMPORTANT: This is the Amplify v6 shape that signInWithRedirect() requires.
  const amplifyV6Config: any = {
    Auth: {
      Cognito: {
        userPoolId: cfg.aws_user_pools_id,
        userPoolClientId: cfg.aws_user_pools_web_client_id,
        identityPoolId: cfg.aws_cognito_identity_pool_id,
        loginWith: {
          oauth: {
            domain,
            scopes: oauth.scope ?? ['openid', 'email', 'profile'],
            redirectSignIn,
            redirectSignOut,
            responseType: oauth.responseType ?? 'code',
          },
        },
      },
    },
  };

  // Debug
  // eslint-disable-next-line no-console
  console.log('[Amplify v6 oauth]:', amplifyV6Config.Auth.Cognito.loginWith.oauth);

  Amplify.configure(amplifyV6Config);

  configured = true;
}
