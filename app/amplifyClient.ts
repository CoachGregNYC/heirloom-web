'use client';

import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);

  const s = String(v).trim();
  if (!s) return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function pickRedirectForThisOrigin(all: string[]): string[] {
  if (typeof window === 'undefined') return all.slice(0, 1);
  const origin = window.location.origin;
  const match = all.find((u) => u.startsWith(origin));
  return match ? [match] : all.slice(0, 1);
}

function env(name: string): string {
  // Next exposes NEXT_PUBLIC_* at runtime in the client bundle
  return (process.env as any)?.[name] ? String((process.env as any)[name]).trim() : '';
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  // Prefer aws-exports.js oauth (local dev), but FALLBACK to env vars (Amplify Hosting safe)
  const oauthFromExports = cfg?.oauth ?? {};
  const oauthFromEnv = {
    domain: env('NEXT_PUBLIC_COGNITO_DOMAIN'),
    redirectSignIn: env('NEXT_PUBLIC_REDIRECT_SIGN_IN'),
    redirectSignOut: env('NEXT_PUBLIC_REDIRECT_SIGN_OUT'),
    scope: 'openid,email,profile',
    responseType: 'code',
  };

  const oauth = {
    ...oauthFromEnv,
    ...oauthFromExports,
  };

  const domain = stripProtocol(String(oauth.domain ?? ''));

  const redirectSignInAll = toStringArray(oauth.redirectSignIn);
  const redirectSignOutAll = toStringArray(oauth.redirectSignOut);

  const redirectSignIn = pickRedirectForThisOrigin(redirectSignInAll);
  const redirectSignOut = pickRedirectForThisOrigin(redirectSignOutAll);

  const scopes = toStringArray(oauth.scope);
  const responseType: 'code' = 'code';

  const amplifyV6Config = {
    Auth: {
      Cognito: {
        userPoolId: String(cfg.aws_user_pools_id ?? ''),
        userPoolClientId: String(cfg.aws_user_pools_web_client_id ?? ''),
        identityPoolId: cfg.aws_cognito_identity_pool_id
          ? String(cfg.aws_cognito_identity_pool_id)
          : undefined,
        loginWith: {
          oauth: {
            domain,
            scopes: scopes.length ? scopes : ['openid', 'email', 'profile'],
            redirectSignIn,
            redirectSignOut,
            responseType,
          },
        },
      },
    },
  } as const;

  // Don’t crash the whole app — log clearly and exit.
  if (!domain || !redirectSignIn.length || !redirectSignOut.length) {
    console.error('[Amplify] OAuth config missing required fields', {
      domain,
      redirectSignIn,
      redirectSignOut,
      rawOauthFromExports: oauthFromExports,
      rawOauthFromEnv: oauthFromEnv,
    });
    return;
  }

  Amplify.configure(amplifyV6Config);

  console.log('[Amplify v6 oauth]:', amplifyV6Config.Auth.Cognito.loginWith.oauth);

  configured = true;
}