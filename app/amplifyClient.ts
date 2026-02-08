'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

let configured = false;

function pickRedirects(redirects: string | undefined): string[] {
  const list = (redirects ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length === 0) return [];

  const origin =
    typeof window !== 'undefined' ? window.location.origin.toLowerCase() : '';
  const exactOriginMatch = list.find((u) => u.toLowerCase().startsWith(origin));
  if (exactOriginMatch) return [exactOriginMatch];

  const httpsMatch = list.find((u) => u.toLowerCase().startsWith('https://'));
  if (httpsMatch) return [httpsMatch];

  return [list[0]];
}

export function ensureAmplifyConfigured() {
  if (configured) return;
  if (typeof window === 'undefined') return;

  const anyExports: any = awsExports as any;

  // Old aws-exports.js shape (what you printed via node)
  const region =
    anyExports.aws_project_region || anyExports.aws_user_files_s3_bucket_region;

  const oauth = anyExports.oauth || {};
  const redirectSignIn = pickRedirects(oauth.redirectSignIn);
  const redirectSignOut = pickRedirects(oauth.redirectSignOut);

  const amplifyV6Config = {
    Auth: {
      Cognito: {
        userPoolId: anyExports.aws_user_pools_id,
        userPoolClientId: anyExports.aws_user_pools_web_client_id,
        identityPoolId: anyExports.aws_cognito_identity_pool_id,

        // Hosted UI / OAuth
        loginWith: {
          oauth: {
            domain: oauth.domain,
            scopes: oauth.scope ?? ['openid', 'email', 'profile'],
            redirectSignIn,
            redirectSignOut,
            responseType: oauth.responseType ?? 'code',
          },
        },
      },
    },
  };

  // Helpful runtime sanity log (you can remove later)
  console.log('[Amplify] OAuth domain:', amplifyV6Config.Auth.Cognito.loginWith.oauth.domain);
console.log('[Amplify] redirectSignIn:', redirectSignIn.join(', '));
console.log('[Amplify] redirectSignOut:', redirectSignOut.join(', '));

  Amplify.configure(amplifyV6Config);

  configured = true;
}