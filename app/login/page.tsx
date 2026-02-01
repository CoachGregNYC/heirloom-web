"use client";

export default function LoginPage() {
  const handleSignIn = () => {
    const loginUrl =
      "https://us-east-15adbu6zms.auth.us-east-1.amazoncognito.com/login" +
      "?client_id=6v8fiesm524hddtugpcesmsn6p" +
      "&response_type=code" +
      "&scope=openid+email+profile" +
      "&redirect_uri=" +
      encodeURIComponent(
        "https://main.dkva3zbv2kejl.amplifyapp.com/auth/callback"
      );

    window.location.href = loginUrl;
  };

  return (
    <main style={{ padding: "3rem" }}>
      <h1>Heirloom</h1>
      <p>Preserve what matters. Private, secure, family-first.</p>

      <button
        onClick={handleSignIn}
        style={{
          marginTop: "2rem",
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        Sign in
      </button>
    </main>
  );
}