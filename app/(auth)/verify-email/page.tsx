import { VerifyEmailClient } from "@/components/VerifyEmailClient";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  return <VerifyEmailClient token={searchParams?.token ?? null} />;
}
