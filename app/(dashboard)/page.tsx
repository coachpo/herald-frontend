"use client";

import Link from "next/link";

import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const verified = Boolean(user?.email_verified_at);

  return (
    <div className="space-y-6">
      {!verified && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your email is not verified. Create actions are disabled until you verify.
          <div className="mt-2">
            <Link className="font-medium underline" href="/account">
              Go to account settings
            </Link>
          </div>
        </div>
      )}

      <div>
        <div className="text-lg font-semibold tracking-tight">Quick actions</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            href="/ingest-endpoints"
            className="rounded-2xl border border-border bg-muted px-4 py-4 hover:bg-muted/80"
          >
            <div className="text-sm font-semibold">Create ingest endpoint</div>
            <div className="mt-1 text-xs text-muted-foreground">Tokenized URL for scripts/services.</div>
          </Link>
          <Link
            href="/channels"
            className="rounded-2xl border border-border bg-muted px-4 py-4 hover:bg-muted/80"
          >
            <div className="text-sm font-semibold">Create channel</div>
            <div className="mt-1 text-xs text-muted-foreground">Point at Bark, ntfy, or MQTT.</div>
          </Link>
          <Link
            href="/rules"
            className="rounded-2xl border border-border bg-muted px-4 py-4 hover:bg-muted/80"
          >
            <div className="text-sm font-semibold">Create rule</div>
            <div className="mt-1 text-xs text-muted-foreground">Match messages and forward.</div>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card px-4 py-4">
        <div className="text-sm font-semibold">Getting started</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Create an ingest endpoint.</li>
          <li>POST text to the ingest URL.</li>
          <li>Create a Bark channel and a rule to forward messages.</li>
        </ol>
      </div>
    </div>
  );
}
