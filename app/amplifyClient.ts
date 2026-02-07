'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

let configured = false;

export function ensureAmplifyConfigured() {
  if (configured) return;

  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const redirectSignIn = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
  const redirectSignOut = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI;

  // Merge OAuth config into awsExports because your generated file has oauth: {}
  const merged = {
    ...awsExports,
    oauth: {
      domain: domain ? domain.replace('https://', '').replace(/\/$/, '') : undefined,
      scope: ['openid', 'email', 'profile'],
      redirectSignIn,
      redirectSignOut,
      responseType: 'code',
    },
  };

  Amplify.configure(merged);
  configured = true;
}