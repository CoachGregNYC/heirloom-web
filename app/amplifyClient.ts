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
  // Amplify v6 expects string[]; we give it ONE best match for the current origin
  if (typeof window === 'undefined') return all.slice(0, 1);
  const origin = window.location.origin;
  const match = all.find((u) => u.startsWith(origin));
  return match ? [match] : all.slice(0, 1);
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  const oauth = cfg?.oauth ?? {};

  const domain = stripProtocol(String(oauth.domain ?? ''));

  const redirectSignInAll = toStringArray(oauth.redirectSignIn);
  const redirectSignOutAll = toStringArray(oauth.redirectSignOut);

  const redirectSignIn = pickRedirectForThisOrigin(redirectSignInAll);
  const redirectSignOut = pickRedirectForThisOrigin(redirectSignOutAll);

  const scopes = toStringArray(oauth.scope);
  const responseType = String(oauth.responseType ?? 'code');

  // ✅ IMPORTANT: This is the Amplify v6 shape that signInWithRedirect requires.
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
            responseType, // "code"
          },
        },
      },
    },
  } as const;

  // Guardrails: fail fast with a readable error if anything is missing
  if (!domain || !redirectSignIn.length || !redirectSignOut.length) {
    // eslint-disable-next-line no-console
    console.error('[Amplify] Invalid OAuth config', {
      domain,
      redirectSignIn,
      redirectSignOut,
      scopes,
      responseType,
    });
    throw new Error(
      `Amplify OAuth config missing required fields: domain=${domain} redirectSignIn=${redirectSignIn} redirectSignOut=${redirectSignOut}`
    );
  }

  Amplify.configure(amplifyV6Config);

  // eslint-disable-next-line no-console
  console.log('[Amplify v6 oauth]:', amplifyV6Config.Auth.Cognito.loginWith.oauth);

  configured = true;
}