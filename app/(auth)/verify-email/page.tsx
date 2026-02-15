import { VerifyEmailClient } from "@/components/VerifyEmailClient";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }> | { token?: string };
}) {
  const sp = await searchParams;
  return <VerifyEmailClient token={sp?.token ?? null} />;
}
