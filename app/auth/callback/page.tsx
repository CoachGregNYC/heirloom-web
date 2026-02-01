// app/auth/callback/page.tsx
import { redirect } from "next/navigation";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getParam(searchParams: Props["searchParams"], key: string): string | null {
  const v = searchParams?.[key];
  if (!v) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export default function AuthCallbackPage({ searchParams }: Props) {
  const code = getParam(searchParams, "code");
  const state = getParam(searchParams, "state");

  if (!code) {
    redirect("/auth/error?reason=missing_code");
  }

  const qs = new URLSearchParams();
  qs.set("code", code);
  if (state) qs.set("state", state);

  // Server token exchange + cookie set happens here:
  redirect(`/api/auth/callback?${qs.toString()}`);
}