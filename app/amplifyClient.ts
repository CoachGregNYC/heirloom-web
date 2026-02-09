'use client';

import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);

  const s = String(v).trim();
  if (!s) return [];

  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function pickBestRedirect(urls: string[]): string[] {
  // Amplify v6 expects string[] for redirectSignIn/Out
  if (urls.length === 0) return [];

  if (typeof window === 'undefined') {
    return [urls[0]];
  }

  const origin = window.location.origin;
  const match = urls.find((u) => u.startsWith(origin));
  return [match ?? urls[0]];
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  const oauth = cfg?.oauth ?? {};

  const domain = stripProtocol(String(oauth.domain ?? ''));

  const redirectSignInAll = toStringArray(oauth.redirectSignIn);
  const redirectSignOutAll = toStringArray(oauth.redirectSignOut);

  const redirectSignIn = pickBestRedirect(redirectSignInAll);
  const redirectSignOut = pickBestRedirect(redirectSignOutAll);

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

  // Loud debug so you can confirm what is live in prod
  // eslint-disable-next-line no-console
  console.log('✅✅✅ AMPLIFY CONFIG LOADED (v6) ✅✅✅');
  // eslint-disable-next-line no-console
  console.log('[Amplify v6 oauth]:', amplifyV6Config.Auth.Cognito.loginWith.oauth);

  // Basic sanity check (this is what your current error complains about)
  const oauthCfg = amplifyV6Config.Auth?.Cognito?.loginWith?.oauth;
  if (!oauthCfg?.domain || !oauthCfg?.redirectSignIn?.length || !oauthCfg?.redirectSignOut?.length) {
    throw new Error(
      `Amplify OAuth config missing required fields: domain=${oauthCfg?.domain} redirectSignIn=${String(
        oauthCfg?.redirectSignIn
      )} redirectSignOut=${String(oauthCfg?.redirectSignOut)}`
    );
  }

  Amplify.configure(amplifyV6Config);

  configured = true;
}
