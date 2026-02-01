import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const tokenRes = await fetch(
    `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        redirect_uri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!,
        code,
      }),
    }
  );

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const tokens = await tokenRes.json();

  const res = NextResponse.redirect(new URL('/', req.url));

  res.cookies.set('access_token', tokens.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  res.cookies.set('id_token', tokens.id_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  return res;
}