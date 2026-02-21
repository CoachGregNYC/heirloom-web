'use client';

import { Amplify } from 'aws-amplify';

let configured = false;

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const domain = stripProtocol(process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '');

  const redirectSignIn = [
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN ||
      process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ||
      '',
  ].filter(Boolean);

  const redirectSignOut = [
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT ||
      process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI ||
      '',
  ].filter(Boolean);

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '';
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

  const scopes = ['openid', 'email', 'profile'];
  const responseType = 'code' as const;

  if (!domain || !redirectSignIn.length || !redirectSignOut.length) {
    console.error('OAuth ENV CONFIG MISSING', {
      domain,
      redirectSignIn,
      redirectSignOut,
    });
    throw new Error('OAuth configuration missing required fields');
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
        loginWith: {
          oauth: {
            domain,
            scopes,
            redirectSignIn,
            redirectSignOut,
            responseType,
          },
        },
      },
    },
  });

  console.log('[Amplify configured]', {
    domain,
    redirectSignIn,
    redirectSignOut,
  });

  configured = true;
}