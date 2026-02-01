// app/auth/callback/page.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  const code = useMemo(() => params.get("code"), [params]);
  const error = useMemo(() => params.get("error"), [params]);
  const errorDescription = useMemo(() => params.get("error_description"), [params]);

  useEffect(() => {
    // If Cognito sent back an OAuth error, route to a friendly error page
    if (error) {
      const reason = errorDescription ? `${error}: ${errorDescription}` : error;
      router.replace(`/auth/error?reason=${encodeURIComponent(reason)}`);
      return;
    }

    // If we got here without a code, something is wrong with the sign-in link or Cognito config
    if (!code) {
      router.replace(`/auth/error?reason=${encodeURIComponent("missing_code")}`);
      return;
    }

    // For now: just show success. Later we can exchange code for tokens via /oauth2/token (PKCE recommended).
  }, [code, error, errorDescription, router]);

  return (
    <main style={{ padding: 32, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1>Signing you in…</h1>

      {code ? (
        <>
          <p>Authorization code received:</p>
          <pre
            style={{
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {code}
          </pre>
          <p style={{ marginTop: 12 }}>✅ Cognito login succeeded.</p>
        </>
      ) : (
        <p>Waiting for authorization code…</p>
      )}
    </main>
  );
}