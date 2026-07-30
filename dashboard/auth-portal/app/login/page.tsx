import UnifiedLoginForm from "@/components/auth/UnifiedLoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  return <UnifiedLoginForm redirectUrl={params.redirect_url} />;
}
