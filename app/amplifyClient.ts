// app/amplifyClient.ts
'use client';

import { Amplify } from 'aws-amplify';

let configured = false;

function requireEnvValue(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

/**
 * Important:
 * - For client-side Next.js, env vars must be referenced as process.env.NEXT_PUBLIC_...
 *   (dynamic access like process.env[name] will be undefined in the browser bundle)
 * - We compute redirect URIs from window.location.origin so prod/local work without code changes.
 * - Cognito MUST still have those exact URLs allow-listed.
 */
export function ensureAmplifyConfigured() {
  if (configured) return;
  if (typeof window === 'undefined') return;

  const userPoolId = requireEnvValue(
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
  );

  const userPoolClientId = requireEnvValue(
    'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID',
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID
  );

  const cognitoDomain = requireEnvValue(
    'NEXT_PUBLIC_COGNITO_DOMAIN',
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN
  ); // e.g. "heirloom-dev-users.auth.us-east-1.amazoncognito.com" (NO https://)

  const origin = window.location.origin;

  const redirectSignIn = `${origin}/auth/callback`;
  const redirectSignOut = `${origin}/login`;

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          loginWith: {
            oauth: {
              domain: cognitoDomain,
              scopes: ['openid', 'email', 'profile'],
              redirectSignIn: [redirectSignIn],
              redirectSignOut: [redirectSignOut],
              responseType: 'code',
            },
          },
        },
      },
    },
    { ssr: false }
  );

  configured = true;
}