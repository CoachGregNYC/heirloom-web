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

function pickRedirectForThisOrigin(urls: string[]): string[] {
  // Amplify v6 expects arrays
  if (typeof window === 'undefined') return urls.slice(0, 1);

  const origin = window.location.origin;
  const match = urls.find(u => u.startsWith(origin));
  return match ? [match] : urls.slice(0, 1);
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  const oauth = cfg?.oauth ?? {};

  const redirectSignInAll = toStringArray(oauth.redirectSignIn);
  const redirectSignOutAll = toStringArray(oauth.redirectSignOut);

  const redirectSignIn = pickRedirectForThisOrigin(redirectSignInAll);
  const redirectSignOut = pickRedirectForThisOrigin(redirectSignOutAll);

  const domain = stripProtocol(String(oauth.domain ?? ''));

  const amplifyV6Config = {
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

  // IMPORTANT: this is what determines whether signInWithRedirect works
  console.log('[Amplify v6 oauth]:', amplifyV6Config.Auth.Cognito.loginWith.oauth);

  Amplify.configure(amplifyV6Config);

  configured = true;
}