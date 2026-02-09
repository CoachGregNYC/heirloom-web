'use client';

import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function firstNonEmpty(...vals: Array<unknown>): string {
  for (const v of vals) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return '';
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;
  const oauth = cfg?.oauth ?? {};

  // ✅ Always derive redirects from the current site at runtime (works for localhost + Amplify)
  // Amplify v6 expects arrays (string[])
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';

  const redirectSignIn = origin ? [`${origin}/auth/callback`] : [];
  const redirectSignOut = origin ? [`${origin}/`] : [];

  // ✅ Domain: prefer NEXT_PUBLIC_COGNITO_DOMAIN if set, else fall back to aws-exports
  // Domain must be WITHOUT https://
  const domain = stripProtocol(
    firstNonEmpty(process.env.NEXT_PUBLIC_COGNITO_DOMAIN, oauth.domain)
  );

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

  // Debug so we can see EXACTLY what prod is using
  // eslint-disable-next-line no-console
  console.log('✅ AMPLIFY v6 CONFIG', amplifyV6Config.Auth.Cognito.loginWith.oauth);

  Amplify.configure(amplifyV6Config);

  configured = true;
}
