import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }> | { next?: string };
}) {
  const sp = await searchParams;
  const nextPath = sp?.next ?? "/";
  return <LoginForm nextPath={nextPath} />;
}
