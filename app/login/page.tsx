'use client';

import { useState } from 'react';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const client = new CognitoIdentityProviderClient({
        region: process.env.NEXT_PUBLIC_COGNITO_REGION,
      });

      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      // Store tokens (temporary — we’ll improve later)
      localStorage.setItem('accessToken', response.AuthenticationResult.AccessToken!);
      localStorage.setItem('idToken', response.AuthenticationResult.IdToken!);
      localStorage.setItem('refreshToken', response.AuthenticationResult.RefreshToken!);

      router.push('/');

    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '80px auto', padding: 24 }}>
      <h1>Heirloom</h1>
      <p>Sign in to your family archive</p>

      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 12 }}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 12 }}
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}