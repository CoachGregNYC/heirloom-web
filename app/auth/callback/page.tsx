"use client";

import { useEffect, useState } from "react";

export default function AuthCallback() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");
    setCode(authCode);
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>Signing you in…</h1>

      {code ? (
        <>
          <p>Authorization code received:</p>
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              background: "#f4f4f4",
              overflowX: "auto",
            }}
          >
            {code}
          </pre>

          <p style={{ marginTop: 16 }}>
            ✅ Cognito login succeeded.
          </p>
        </>
      ) : (
        <p>Waiting for authorization code…</p>
      )}
    </main>
  );
}