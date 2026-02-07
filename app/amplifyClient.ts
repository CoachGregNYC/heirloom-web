'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

let configured = false;

export function ensureAmplifyConfigured() {
  if (configured) return;
  Amplify.configure(awsExports);
  configured = true;
}