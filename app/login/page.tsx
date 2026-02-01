"use client";

import React from "react";

export default function LoginPage() {
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // e.g. https://us-east-15adbu6zms.auth.us-east-1.amazoncognito.com
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

  const handleSignIn = () => {
    if (!cognitoDomain || !clientId || !redirectUri) {
      alert(
        "Missing env vars. Need NEXT_PUBLIC_COGNITO_DOMAIN, NEXT_PUBLIC_COGNITO_CLIENT_ID, NEXT_PUBLIC_COGNITO_REDIRECT_URI"
      );
      return;
    }

    const url =
      `${cognitoDomain.replace(/\/$/, "")}/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = url;
  };

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ marginBottom: 6 }}>Heirloom</h1>
      <p style={{ marginTop: 0, marginBottom: 24 }}>
        Preserve what matters. Private, secure, family-first.
      </p>

      <button
        onClick={handleSignIn}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #ddd",
          background: "white",
          cursor: "pointer",
        }}
      >
        Sign in
      </button>
    </main>
  );
}