"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { LoginForm } from "@/components/LoginForm";

function sanitizeSameSiteNextPath(raw: string | null): string {
  const p = (raw || "").trim();
  if (!p) return "/";

  if (!p.startsWith("/")) return "/";
  if (p.startsWith("//")) return "/";
  return p;
}

function LoginPageInner() {
  const sp = useSearchParams();
  const nextPath = useMemo(() => sanitizeSameSiteNextPath(sp.get("next")), [sp]);
  return <LoginForm nextPath={nextPath} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginForm nextPath="/" />}>
      <LoginPageInner />
    </Suspense>
  );
}
