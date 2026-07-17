import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/password-reset-forms";

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string; email?: string } }) {
  return <AuthShell title="Nouveau mot de passe" description="Choisissez un mot de passe robuste pour proteger votre espace achats."><ResetPasswordForm token={searchParams.token ?? ""} email={searchParams.email ?? ""} /></AuthShell>;
}
