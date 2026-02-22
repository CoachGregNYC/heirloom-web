'use client';

import 'aws-amplify/auth/enable-oauth-listener';
import { Amplify } from 'aws-amplify';
import awsExportsRaw from '../aws-exports';

let configured = false;

function stripProtocol(domainLike: string): string {
  return domainLike.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function pickRedirectForThisOrigin(csv: string): string[] {
  const all = (csv || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (!all.length) return [];

  if (typeof window === 'undefined') return [all[0]];

  const origin = window.location.origin;
  const match = all.find((u) => u.startsWith(origin));
  return [match ?? all[0]];
}

export function ensureAmplifyConfigured() {
  if (configured) return;

  const cfg: any = (awsExportsRaw as any)?.default ?? awsExportsRaw;

  // ---- ENV (authoritative for hosted UI redirects/domain/client) ----
  const domainEnv = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '';
  const redirectInEnv = process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || '';
  const redirectOutEnv = process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || '';

  const domain = stripProtocol(domainEnv);
  const redirectSignIn = pickRedirectForThisOrigin(redirectInEnv);
  const redirectSignOut = pickRedirectForThisOrigin(redirectOutEnv);

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '';
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

  // ---- From aws-exports (for AWS credentials + S3) ----
  const identityPoolId = cfg.aws_cognito_identity_pool_id
    ? String(cfg.aws_cognito_identity_pool_id)
    : undefined;

  const bucket = String(cfg.aws_user_files_s3_bucket ?? '');
  const region = String(cfg.aws_user_files_s3_bucket_region ?? cfg.aws_project_region ?? 'us-east-1');

  const scopes = ['openid', 'email', 'profile'];
  const responseType = 'code' as const;

  if (!domain || !redirectSignIn.length || !redirectSignOut.length) {
    console.error('OAuth ENV CONFIG MISSING', { domain, redirectSignIn, redirectSignOut });
    throw new Error('OAuth configuration missing required fields');
  }
  if (!userPoolId || !clientId) {
    console.error('UserPool ENV CONFIG MISSING', { userPoolId, clientId });
    throw new Error('UserPool configuration missing required fields');
  }
  if (!identityPoolId) {
    console.error('Identity Pool missing in aws-exports.js', { identityPoolId });
    throw new Error('Identity Pool configuration missing (required for S3 protected access)');
  }
  if (!bucket || !region) {
    console.error('S3 config missing in aws-exports.js', { bucket, region });
    throw new Error('S3 configuration missing');
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
        identityPoolId,
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
    Storage: {
      S3: {
        bucket,
        region,
      },
    },
  });

  // Helpful debug
  console.log('[Amplify configured]', {
    domain,
    redirectSignIn,
    redirectSignOut,
    userPoolId,
    clientId,
    identityPoolId,
    bucket,
    region,
  });

  configured = true;
}