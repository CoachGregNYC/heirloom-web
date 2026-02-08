'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

let configured = false;

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);

  const s = String(v).trim();
  if (!s) return [];

  // aws-exports often uses comma-separated redirects
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function pickBestRedirect(urls: string[]): string[] {
  // Prefer the current origin if present, else fall back to first entry.
  if (typeof window === 'undefined') return urls.slice(0, 1);
  const origin = window.location.origin;
  const match = urls.find((u) => u.startsWith(origin));
  return match ? [match] : urls.slice(0, 1);
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const anyExports: any = (awsExports as any)?.default ?? awsExports;

  const region =
    anyExports.aws_project_region || anyExports.aws_user_files_s3_bucket_region || 'us-east-1';

  const oauth = anyExports.oauth ?? {};

  const redirectInAll = toStringArray(oauth.redirectSignIn);
  const redirectOutAll = toStringArray(oauth.redirectSignOut);

  // v6 expects arrays (string[])
  const redirectSignIn = pickBestRedirect(redirectInAll);
  const redirectSignOut = pickBestRedirect(redirectOutAll);

  // v6 expects domain WITHOUT https://
  const domain = stripProtocol(String(oauth.domain ?? ''));

  const amplifyV6Config: any = {
    Auth: {
      Cognito: {
        userPoolId: anyExports.aws_user_pools_id,
        userPoolClientId: anyExports.aws_user_pools_web_client_id,
        identityPoolId: anyExports.aws_cognito_identity_pool_id,
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

  // Debug (keep for now)
  console.log('[Amplify] domain:', domain);
  console.log('[Amplify] redirectSignIn:', redirectSignIn);
  console.log('[Amplify] redirectSignOut:', redirectSignOut);

  Amplify.configure(amplifyV6Config);

  configured = true;
}
