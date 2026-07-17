import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell title="Creer votre compte" description="Configurez votre espace achats en quelques minutes.">
      <RegisterForm />
    </AuthShell>
  );
}
