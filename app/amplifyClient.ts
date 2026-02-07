'use client';

import awsExports from '../aws-exports';
import { Amplify } from 'aws-amplify';

let configured = false;

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const domain = requireEnv('NEXT_PUBLIC_COGNITO_DOMAIN', process.env.NEXT_PUBLIC_COGNITO_DOMAIN)
    .replace(/^https?:\/\//, '') // Amplify expects domain without scheme
    .replace(/\/$/, '');

  const clientId = requireEnv('NEXT_PUBLIC_COGNITO_CLIENT_ID', process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
  const redirectSignIn = requireEnv('NEXT_PUBLIC_COGNITO_REDIRECT_URI', process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI);
  const redirectSignOut = requireEnv('NEXT_PUBLIC_COGNITO_LOGOUT_URI', process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI);

  // Override ONLY what aws-exports is missing/incorrect for web OAuth
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: awsExports.aws_user_pools_id,
        userPoolClientId: clientId, // IMPORTANT: use the web app client id you actually configured in Cognito
        identityPoolId: awsExports.aws_cognito_identity_pool_id,
        loginWith: {
          oauth: {
            domain,
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [redirectSignIn],
            redirectSignOut: [redirectSignOut],
            responseType: 'code',
          },
        },
      },
    },
    Storage: {
      S3: {
        bucket: awsExports.aws_user_files_s3_bucket,
        region: awsExports.aws_user_files_s3_bucket_region,
      },
    },
  });

  configured = true;
}