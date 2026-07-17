import { AppShell } from "@/components/app-shell";
import { DashboardPage } from "@/features/dashboard/dashboard-page";

export default function Page() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}

