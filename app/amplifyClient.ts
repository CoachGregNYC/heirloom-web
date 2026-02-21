'use client';

import 'aws-amplify/auth/enable-oauth-listener';
import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function getAwsExports(): any {
  return (awsExportsRaw as any)?.default ?? awsExportsRaw;
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const awsExports = getAwsExports();

  // Prefer ENV (Amplify Hosting)
  const domainRaw =
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN ||
    awsExports?.oauth?.domain ||
    '';

  const redirectSignInRaw =
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN ||
    process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ||
    awsExports?.oauth?.redirectSignIn ||
    '';

  const redirectSignOutRaw =
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT ||
    process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI ||
    awsExports?.oauth?.redirectSignOut ||
    '';

  const userPoolId =
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ||
    awsExports?.aws_user_pools_id ||
    '';

  const clientId =
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
    awsExports?.aws_user_pools_web_client_id ||
    '';

  const domain = stripProtocol(String(domainRaw));

  // aws-exports often stores these as comma-separated strings
  const redirectSignIn = String(redirectSignInRaw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const redirectSignOut = String(redirectSignOutRaw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const scopes = ['openid', 'email', 'profile'] as const;
  const responseType = 'code' as const;

  if (!domain || !redirectSignIn.length || !redirectSignOut.length || !userPoolId || !clientId) {
    // eslint-disable-next-line no-console
    console.error('OAuth CONFIG MISSING', {
      domain,
      redirectSignIn,
      redirectSignOut,
      userPoolId,
      clientId,
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
            scopes: [...scopes],
            redirectSignIn,
            redirectSignOut,
            responseType,
          },
        },
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('[Amplify configured]', {
    domain,
    redirectSignIn,
    redirectSignOut,
    userPoolId,
    clientId,
  });

  configured = true;
}