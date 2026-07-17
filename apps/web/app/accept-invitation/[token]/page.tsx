import { AuthShell } from "@/components/auth-shell";
import { InvitationForm } from "@/features/auth/invitation-form";

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  return <AuthShell title="Rejoindre votre equipe" description="Confirmez votre identite pour activer votre acces ProcuFlow."><InvitationForm token={params.token} /></AuthShell>;
}
