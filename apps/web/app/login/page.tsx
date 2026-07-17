import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Connexion" description="Accedez a l'espace achats de votre entreprise.">
      <LoginForm />
    </AuthShell>
  );
}
