'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

let configured = false;

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const domainUrl = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // e.g. https://xxxx.auth.us-east-1.amazoncognito.com
  const redirectSignIn = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI; // https://.../auth/callback
  const redirectSignOut = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI; // https://.../

  if (!domainUrl || !redirectSignIn || !redirectSignOut) {
    // Don’t throw hard here; just configure base exports and let pages show a friendly error.
    Amplify.configure(awsExports, { ssr: false });
    configured = true;
    return;
  }

  const oauth = {
    domain: stripProtocol(domainUrl),
    scope: ['openid', 'email', 'profile'],
    redirectSignIn,
    redirectSignOut,
    responseType: 'code' as const,
  };

  // Merge oauth into awsExports for Amplify Auth
  const merged = {
    ...awsExports,
    oauth,
  };

  Amplify.configure(merged, { ssr: false });
  configured = true;
}