'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../amplifyClient';

export default function AppPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    ensureAmplifyConfigured();

    getCurrentUser()
      .then((u: any) => {
        const e =
          u?.signInDetails?.loginId ||
          u?.username ||
          null;
        setEmail(e);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const onSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>

      {email ? (
        <>
          <p>✅ Signed in as {email}</p>
          <button onClick={onSignOut}>Sign out</button>
          <hr style={{ margin: '24px 0' }} />
          <h2>Family Filing Cabinet</h2>
          <p>Authenticated area — next step is wiring S3 with Cognito Identity.</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
