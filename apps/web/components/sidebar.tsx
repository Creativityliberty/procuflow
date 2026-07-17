"use client";

import {
  Building2,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
  Settings,
  UsersRound,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { navItems } from "@/lib/nav";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  tenantName: string;
  onLogout: () => void;
};

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
  tenantName,
  onLogout
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/10 bg-[#1d1724]/95 text-white shadow-[10px_0_30px_rgba(29,23,36,0.08)] backdrop-blur-xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      ].join(" ")}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-3">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-3"
          aria-label="ProcuFlow - Accueil"
          onClick={onCloseMobile}
        >
          <BrandMark />
          {!collapsed ? (
            <span className="min-w-0 leading-tight">
              <strong className="brand-wordmark block truncate">ProcuFlow</strong>
              <small className="text-xs text-white/55">Gestion des achats</small>
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={onCloseMobile}
          className="grid h-9 w-9 place-items-center rounded-xl text-white/70 hover:bg-white/10 lg:hidden"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
      </div>

      {!collapsed ? (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-2">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-white/10">
            <Building2 size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-xs">{tenantName}</strong>
            <small className="text-[11px] text-white/55">Espace entreprise</small>
          </span>
          <ChevronRight size={15} className="text-white/40" />
        </div>
      ) : null}

      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-2" aria-label="Navigation principale">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              href={item.href}
              key={item.label}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              onClick={onCloseMobile}
              className={[
                "group flex h-10 items-center rounded-xl text-[13px] font-medium transition-colors",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                active
                  ? "bg-[var(--violet)] text-white"
                  : "text-white/70 hover:bg-white/[0.08] hover:text-white"
              ].join(" ")}
            >
              <Icon size={18} className="flex-none" strokeWidth={1.8} />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <Link
          href="/settings/subscription"
          title={collapsed ? "Abonnement" : undefined}
          className={[
            "flex h-10 items-center rounded-xl text-[13px] text-white/70 hover:bg-white/[0.08] hover:text-white",
            collapsed ? "justify-center" : "gap-3 px-3"
          ].join(" ")}
        >
          <CreditCard size={18} strokeWidth={1.8} />
          {!collapsed ? "Abonnement" : null}
        </Link>
        <Link
          href="/settings/team"
          title={collapsed ? "Equipe et acces" : undefined}
          className={[
            "flex h-10 items-center rounded-xl text-[13px] text-white/70 hover:bg-white/[0.08] hover:text-white",
            collapsed ? "justify-center" : "gap-3 px-3"
          ].join(" ")}
        >
          <UsersRound size={18} strokeWidth={1.8} />
          {!collapsed ? "Equipe et acces" : null}
        </Link>
        <Link
          href="/settings/workflows"
          title={collapsed ? "Parametres" : undefined}
          className={[
            "flex h-10 items-center rounded-xl text-[13px] text-white/70 hover:bg-white/[0.08] hover:text-white",
            collapsed ? "justify-center" : "gap-3 px-3"
          ].join(" ")}
        >
          <Settings size={18} strokeWidth={1.8} />
          {!collapsed ? "Parametres" : null}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Se deconnecter" : undefined}
          className={[
            "flex h-10 w-full items-center rounded-xl text-[13px] text-white/70 hover:bg-white/[0.08] hover:text-white",
            collapsed ? "justify-center" : "gap-3 px-3"
          ].join(" ")}
        >
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed ? "Se deconnecter" : null}
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={[
            "mt-1 hidden h-10 w-full items-center rounded-xl text-[13px] text-white/70 hover:bg-white/[0.08] hover:text-white lg:flex",
            collapsed ? "justify-center" : "gap-3 px-3"
          ].join(" ")}
          title={collapsed ? "Agrandir le menu" : "Reduire le menu"}
          aria-label={collapsed ? "Agrandir le menu" : "Reduire le menu"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed ? "Reduire le menu" : null}
        </button>
      </div>
    </aside>
  );
}
