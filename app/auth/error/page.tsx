// app/auth/error/page.tsx
"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const params = useSearchParams();
  const reason = useMemo(() => params.get("reason") || "unknown", [params]);

  return (
    <main style={{ padding: 32, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1>Sign-in error</h1>
      <p style={{ marginTop: 8 }}>
        Something went wrong during login. Reason:
      </p>
      <pre
        style={{
          padding: 12,
          background: "#fff3f3",
          borderRadius: 8,
          border: "1px solid #ffb3b3",
          overflowX: "auto",
        }}
      >
        {reason}
      </pre>

      <p style={{ marginTop: 16 }}>
        Try again from <a href="/login">/login</a>.
      </p>
    </main>
  );
}