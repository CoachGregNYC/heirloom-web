// app/amplifyClient.ts
'use client';

import { Amplify } from 'aws-amplify';

let configured = false;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Important:
 * - We compute redirect URIs from window.location.origin so prod/local work without code changes.
 * - Cognito MUST still have those exact URLs allow-listed.
 */
export function ensureAmplifyConfigured() {
  if (configured) return;

  // Only configure in browser
  if (typeof window === 'undefined') return;

  const userPoolId = requireEnv('NEXT_PUBLIC_COGNITO_USER_POOL_ID');
  const userPoolClientId = requireEnv('NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID');
  const cognitoDomain = requireEnv('NEXT_PUBLIC_COGNITO_DOMAIN'); // e.g. "heirloom-dev-users.auth.us-east-1.amazoncognito.com"

  const origin = window.location.origin;

  // These must match EXACTLY what you allow-list in Cognito
  const redirectSignIn = `${origin}/auth/callback`;
  const redirectSignOut = `${origin}/login`;

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          // If you later add Identity Pool, add identityPoolId here.
          loginWith: {
            oauth: {
              domain: cognitoDomain,
              scopes: ['openid', 'email', 'profile'],
              redirectSignIn: [redirectSignIn],
              redirectSignOut: [redirectSignOut],
              responseType: 'code', // PKCE code flow
            },
          },
        },
      },
    },
    { ssr: false }
  );

  configured = true;
}