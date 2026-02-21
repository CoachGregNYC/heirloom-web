// app/apiClient.ts
'use client';

/**
 * Centralized API client for the Heirloom web app.
 *
 * - Uses NEXT_PUBLIC_API_BASE_URL from .env.local (and Amplify environment vars in prod)
 * - Automatically prepends the base URL for relative paths like "/items"
 * - Automatically attaches Authorization: Bearer <token> if present
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

function getAccessToken(): string | null {
  // Your project has historically used these localStorage keys.
  // If you later switch to Amplify-only tokens, we’ll update this.
  try {
    return localStorage.getItem('heirloom_access_token');
  } catch {
    return null;
  }
}

export async function apiFetch(input: string, init: ApiClientOptions = {}) {
  const url = buildUrl(input);

  const headers = new Headers(init.headers ?? {});
  // Default content type for JSON requests (don’t override if caller set it)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (!init.skipAuth) {
    const token = getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(url, { ...init, headers });

  // parse response safely
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