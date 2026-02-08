'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

let configured = false;

export function ensureAmplifyConfigured() {
  if (configured) return;

  // Safety: only configure in the browser
  if (typeof window === 'undefined') return;

  // Client-only config (most reliable for Amplify Hosting static output)
  Amplify.configure(awsExports);

  configured = true;
}