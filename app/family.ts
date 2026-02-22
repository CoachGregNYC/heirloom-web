// app/family.ts
'use client';

/**
 * Family model (MVP - Option A):
 * - Everyone uses the same familyId for now.
 * - Source of truth is NEXT_PUBLIC_FAMILY_ID.
 *
 * Later we can replace this with:
 * - token claims
 * - a /me endpoint
 * - a real "Families" table keyed by user sub/email
 */

export function getFamilyId(): string {
  const fid = (process.env.NEXT_PUBLIC_FAMILY_ID || '').trim();
  if (!fid) {
    throw new Error(
      'Missing NEXT_PUBLIC_FAMILY_ID. Add it to .env.local for local dev and to Amplify Hosting environment variables for prod.'
    );
  }
  return fid;
}