'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

let configured = false;

export function ensureAmplifyConfigured() {
  if (configured) return;

  // Configure Amplify once on the client
  Amplify.configure(awsExports, { ssr: true });

  configured = true;
}
