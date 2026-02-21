'use client';

import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function pickRedirect(urls: string[]): string {
  if (!urls.length) return '';
  if (typeof window === 'undefined') return urls[0];
  const origin = window.location.origin;
  return urls.find((u) => u.startsWith(origin)) ?? urls[0];
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  const oauth = cfg.oauth ?? {};

  const redirectSignIn = pickRedirect(toStringArray(oauth.redirectSignIn));
  const redirectSignOut = pickRedirect(toStringArray(oauth.redirectSignOut));
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
            redirectSignIn: [redirectSignIn],
            redirectSignOut: [redirectSignOut],
            responseType: oauth.responseType ?? 'code',
          },
        },
      },
    },
  };

  // Debug: you should see NON-empty values in prod console
  // eslint-disable-next-line no-console
  console.log('[Amplify v6 oauth]:', amplifyV6Config.Auth.Cognito.loginWith.oauth);

  Amplify.configure(amplifyV6Config);
  configured = true;
}