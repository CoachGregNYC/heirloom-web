'use client';

import { signInWithRedirect } from 'aws-amplify/auth';

export default function LoginPage() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Heirloom</h1>
      <p>Preserve what matters. Private, secure, family-first.</p>

      <button
        onClick={() => signInWithRedirect()}
        style={{
          marginTop: 24,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid #111',
          background: '#111',
          color: '#fff',
        }}
      >
        Sign in
      </button>
    </main>
  );
}