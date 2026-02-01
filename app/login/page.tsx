// app/login/page.tsx
"use client";

import React from "react";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export default function LoginPage() {
  // These MUST be set in Amplify Hosting env vars
  const cognitoDomain = requireEnv("NEXT_PUBLIC_COGNITO_DOMAIN"); // e.g. https://us-east-1_XXXX.auth.us-east-1.amazoncognito.com
  const clientId = requireEnv("NEXT_PUBLIC_COGNITO_CLIENT_ID");
  const redirectUri = requireEnv("NEXT_PUBLIC_COGNITO_REDIRECT_URI"); // https://<your-amplify-domain>/auth/callback

  const scope = "openid email profile";
  const responseType = "code";

  // IMPORTANT: Use /oauth2/authorize (this is the canonical Hosted UI entrypoint)
  const authorizeUrl =
    `${cognitoDomain.replace(/\/$/, "")}/oauth2/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=${encodeURIComponent(responseType)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return (
    <main style={{ padding: 32, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ margin: 0 }}>Heirloom</h1>
      <p style={{ marginTop: 8 }}>Preserve what matters. Private, secure, family-first.</p>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Sign in</h2>

        <a
          href={authorizeUrl}
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #111",
            textDecoration: "none",
            color: "#111",
            fontWeight: 600,
          }}
        >
          Sign in
        </a>

        <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
          (Debug) Redirect URI: <code>{redirectUri}</code>
        </p>
      </div>
    </main>
  );
}