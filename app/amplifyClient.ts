'use client';

import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);

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

function preferOriginFirst(urls: string[]): string[] {
  if (typeof window === 'undefined') return urls;
  const origin = window.location.origin;
  const match = urls.find((u) => u.startsWith(origin));
  if (!match) return urls;
  return [match, ...urls.filter((u) => u !== match)];
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  // IMPORTANT: never configure during SSR/build — only in the browser.
  if (typeof window === 'undefined') return;

  const ex: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  const oauth = ex?.oauth ?? {};
  const domain = stripProtocol(String(oauth.domain ?? ''));

  const redirectSignIn = preferOriginFirst(toStringArray(oauth.redirectSignIn));
  const redirectSignOut = preferOriginFirst(toStringArray(oauth.redirectSignOut));

  const amplifyV6Config: any = {
    Auth: {
      Cognito: {
        userPoolId: ex.aws_user_pools_id,
        userPoolClientId: ex.aws_user_pools_web_client_id,
        identityPoolId: ex.aws_cognito_identity_pool_id,
        loginWith: {
          oauth: {
            domain,
            scopes: Array.isArray(oauth.scope) ? oauth.scope : ['openid', 'email', 'profile'],
            redirectSignIn,
            redirectSignOut,
            responseType: oauth.responseType ?? 'code',
          },
        },
      },
    },
  };

  console.log('[Amplify v6 oauth]:', amplifyV6Config.Auth.Cognito.loginWith.oauth);

  Amplify.configure(amplifyV6Config);
  configured = true;
}