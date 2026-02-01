"use client";

export default function Home() {
  const login = () => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!;

    const loginUrl =
      `${domain}/oauth2/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=openid+email+profile`;

    window.location.href = loginUrl;
  };

  return (
    <main style={{ padding: 32 }}>
      <h1>Heirloom</h1>
      <p>Preserve what matters. Private, secure, family-first.</p>

      <button
        onClick={login}
        style={{
          marginTop: 24,
          padding: "12px 18px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Sign in
      </button>
    </main>
  );
}