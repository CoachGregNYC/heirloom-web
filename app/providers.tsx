'use client';

import 'aws-amplify/auth/enable-oauth-listener';
import { useEffect } from 'react';
import 'aws-amplify/auth/enable-oauth-listener';
import { ensureAmplifyConfigured } from './amplifyClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Configure Amplify once, as early as possible on the client.
    ensureAmplifyConfigured();
  }, []);

  return <>{children}</>;
}