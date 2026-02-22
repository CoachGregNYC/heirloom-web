// app/apiClient.ts
'use client';

import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Centralized API client for the Heirloom web app.
 *
 * - Uses NEXT_PUBLIC_API_BASE_URL
 * - Automatically prepends the base URL for relative paths like "/items"
 * - Automatically attaches Authorization: Bearer <JWT> (ID token) from Amplify session
 */

type ApiClientOptions = RequestInit & {
  /** If true, do NOT attach Authorization header */
  skipAuth?: boolean;
};

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!base) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');
  }
  return base.replace(/\/$/, '');
}

function isAbsoluteUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

function buildUrl(input: string): string {
  if (isAbsoluteUrl(input)) return input;
  const base = getBaseUrl();
  const path = input.startsWith('/') ? input : `/${input}`;
  return `${base}${path}`;
}

async function getJwtFromAmplify(): Promise<string | null> {
  try {
    // fetchAuthSession reads the current logged-in session (cookies/storage managed by Amplify)
    const session = await fetchAuthSession();

    // For API Gateway JWT authorizers, ID token is typically the safest bet.
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) return idToken;

    // Fallback: access token (some setups validate this instead)
    const accessToken = session.tokens?.accessToken?.toString();
    if (accessToken) return accessToken;

    return null;
  } catch {
    return null;
  }
}

export async function apiFetch(input: string, init: ApiClientOptions = {}) {
  const url = buildUrl(input);

  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (!init.skipAuth) {
    const token = await getJwtFromAmplify();
    if (!token) {
      throw new Error('Not authenticated: no Cognito token available (fetchAuthSession returned none).');
    }
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(url, { ...init, headers });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      typeof data === 'string'
        ? data
        : data?.message
        ? String(data.message)
        : JSON.stringify(data);
    throw new Error(`API ${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}