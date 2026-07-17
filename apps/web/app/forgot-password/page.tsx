import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/password-reset-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Mot de passe oublie" description="Saisissez votre e-mail professionnel pour recevoir un lien de reinitialisation.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
