import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }> | { token?: string };
}) {
  const sp = await searchParams;
  return <ResetPasswordForm token={sp?.token ?? null} />;
}
