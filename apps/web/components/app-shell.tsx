"use client";

import { Bell, Menu, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { demoMode } from "@/lib/api-client";
import { currentSession, getNotifications, logout, readAllNotifications, readNotification } from "@/lib/procuflow-api";
import type { AppNotificationRecord } from "@/lib/types";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tenantName, setTenantName] = useState("Mon entreprise");
  const [notifications, setNotifications] = useState<AppNotificationRecord[]>([]);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("pf-sidebar-collapsed") === "true");
    Promise.all([currentSession(), getNotifications()])
      .then(([session, inbox]) => {
        setTenantName(session.tenant.name);
        setNotifications(inbox.data);
      })
      .catch(() => {
        if (!demoMode) router.replace("/login");
      });
  }, [router]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("pf-sidebar-collapsed", String(next));
      return next;
    });
  }

  async function handleLogout() {
    await logout().catch(() => undefined);
    router.replace("/login");
  }

  return (
    <div
      className={[
        "min-h-screen lg:grid lg:transition-[grid-template-columns] lg:duration-200",
        collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[240px_1fr]"
      ].join(" ")}
    >
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={toggleCollapsed}
        tenantName={tenantName}
        onLogout={() => void handleLogout()}
      />

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-white/80 px-4 shadow-[0_3px_16px_rgba(31,24,40,0.035)] backdrop-blur-md lg:px-6">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-white text-[#4c4653] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={19} />
          </button>

          <form action="/suppliers" className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8491]" size={17} />
            <label className="sr-only" htmlFor="global-search">Rechercher</label>
            <input
              id="global-search"
              name="q"
              type="search"
              className="h-9 w-full rounded-xl border border-[var(--border)] bg-white/65 pl-9 pr-3 outline-none backdrop-blur-md focus:border-[var(--violet)]"
              placeholder="Rechercher une demande, un fournisseur..."
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-white text-[#4c4653]"
                aria-label="Notifications"
                title="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((value) => !value)}
              >
                <Bell size={18} />
                {notifications.some((row) => !row.read_at) ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--violet)]" /> : null}
              </button>
              {notificationsOpen ? (
                <section className="app-panel absolute right-0 top-11 w-[min(340px,calc(100vw-32px))] overflow-hidden text-left shadow-lg">
                  <div className="flex items-center justify-between border-b border-[var(--border)] p-3"><strong className="text-sm">Notifications</strong>{notifications.some(row=>!row.read_at)?<button className="text-xs font-semibold text-violet-700" onClick={async()=>{await readAllNotifications();setNotifications(rows=>rows.map(row=>({...row,read_at:new Date().toISOString()})))}}>Tout lire</button>:null}</div>
                  <div className="divide-y divide-[var(--border)]">{notifications.length === 0 ? <p className="m-0 p-4 text-sm text-[var(--muted)]">Aucune alerte en attente.</p> : notifications.slice(0, 6).map((notice) => <Link href={notice.action_url??"/"} key={notice.id} className={`block p-3 hover:bg-[var(--surface-soft)] ${notice.read_at?"opacity-60":""}`} onClick={async()=>{await readNotification(notice.id);setNotificationsOpen(false)}}><strong className="block text-sm">{notice.title}</strong><small className="text-[var(--muted)]">{notice.body}</small></Link>)}</div>
                  <Link href="/settings/automations" className="block border-t border-[var(--border)] p-3 text-center text-sm font-semibold text-[var(--violet)]" onClick={() => setNotificationsOpen(false)}>Regler les alertes</Link>
                </section>
              ) : null}
            </div>
            <Link href="/purchase-requests/new" className="primary-button">
              <Plus size={17} />
              <span className="hidden sm:inline">Nouvelle demande</span>
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1500px] p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
