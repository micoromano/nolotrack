"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  House, Clock, Car, Wallet, Receipt, FileText, SignOut,
  GasPump, Money, PaperPlaneTilt, CalendarBlank, Users,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { Permessi } from "@/lib/permessi";
import PushSubscribe from "@/components/push-subscribe";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface VoceNav {
  href: string;
  label: string;
  icon: PhosphorIcon;
  color: string;
  sezione: string;
}

const vociDesktop: VoceNav[] = [
  { href: "/dashboard",            label: "Home",       icon: House,          color: "text-primary",     sezione: "home" },
  { href: "/dashboard/turni",      label: "Turni",      icon: Clock,          color: "text-sky-400",     sezione: "turni" },
  { href: "/dashboard/corse",      label: "Corse",      icon: Car,            color: "text-emerald-400", sezione: "corse" },
  { href: "/dashboard/cassa",      label: "Cassa",      icon: Wallet,         color: "text-amber-400",   sezione: "cassa" },
  { href: "/dashboard/spese",      label: "Spese",      icon: Receipt,        color: "text-rose-400",    sezione: "spese" },
  { href: "/dashboard/agenda",     label: "Agenda",     icon: CalendarBlank,  color: "text-indigo-400",  sezione: "agenda" },
  { href: "/dashboard/carburante", label: "Carburante", icon: GasPump,        color: "text-orange-400",  sezione: "carburante" },
  { href: "/dashboard/stipendio",  label: "Stipendio",  icon: Money,          color: "text-green-400",   sezione: "stipendio" },
  { href: "/dashboard/report",     label: "Report",     icon: FileText,       color: "text-violet-400",  sezione: "report" },
  { href: "/dashboard/invia",      label: "Invia",      icon: PaperPlaneTilt, color: "text-cyan-400",    sezione: "invia" },
  { href: "/dashboard/admin",      label: "Admin",      icon: Users,          color: "text-slate-400",   sezione: "admin" },
];

const sezioniMobile = ["home", "turni", "corse", "cassa", "spese", "agenda", "carburante", "stipendio", "report", "invia", "admin"];

export default function NavBar({ userEmail, permessi }: { userEmail: string; permessi: Permessi }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  async function esci() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const vociVisibili = vociDesktop.filter(v => permessi[v.sezione]?.can_view !== false);
  const vociMobile = vociDesktop.filter(v => sezioniMobile.includes(v.sezione) && permessi[v.sezione]?.can_view !== false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-64 bg-surface-container-lowest border-r border-border-subtle flex-col z-40 shadow-xl shadow-black/40">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border-subtle shrink-0">
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Car size={16} weight="fill" className="text-on-primary-container" />
          </div>
          <div>
            <span className="font-heading font-black text-primary text-lg leading-none block">NoloTrack</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Fleet Management</span>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto space-y-0.5 px-2">
          {vociVisibili.map(({ href, label, icon: Icon, color }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                  active
                    ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                )}
              >
                <span className={cn(
                  "flex items-center justify-center shrink-0 transition-all",
                  active ? "text-on-primary" : color
                )}>
                  <Icon size={17} weight={active ? "fill" : "regular"} />
                </span>
                <span className={cn(
                  "text-xs font-semibold tracking-wide uppercase",
                  active ? "text-on-primary" : "text-on-surface-variant group-hover:text-on-surface"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-subtle p-3 shrink-0 space-y-1">
          <div className="px-1 pb-2">
            <select
              value={theme ?? "dark"}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-surface-container border border-border-subtle text-xs text-on-surface-variant px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="dark">🌙 Scuro</option>
              <option value="light">☀️ Chiaro</option>
              <option value="system">💻 Sistema</option>
            </select>
          </div>
          <p className="text-xs text-on-surface-variant px-1 truncate">{userEmail}</p>
          <PushSubscribe />
          <button
            onClick={esci}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors rounded-lg"
          >
            <SignOut size={13} weight="bold" />
            Disconnetti
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-border-subtle flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary-container rounded flex items-center justify-center">
            <Car size={13} weight="fill" className="text-on-primary-container" />
          </div>
          <span className="font-heading font-black text-primary text-base">NoloTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={theme ?? "dark"}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-transparent text-on-surface-variant text-xs border-none focus:outline-none"
          >
            <option value="dark">🌙</option>
            <option value="light">☀️</option>
            <option value="system">💻</option>
          </select>
          <button onClick={esci} className="text-on-surface-variant p-1">
            <SignOut size={18} weight="bold" />
          </button>
        </div>
      </header>

      {/* Mobile bottom tabs */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-border-subtle safe-area-bottom">
        <div className="flex h-16 overflow-x-auto scrollbar-none">
          {vociMobile.map(({ href, label, icon: Icon, color }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all relative pt-1 shrink-0 w-16",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {active && (
                  <span className="absolute top-0 left-4 right-4 h-0.5 bg-primary rounded-b" />
                )}
                <span className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                  active ? cn("bg-primary/10", color) : ""
                )}>
                  <Icon size={20} weight={active ? "fill" : "regular"} />
                </span>
                <span className={cn("text-[10px] font-semibold leading-none uppercase tracking-wide", active ? "text-foreground" : "text-muted-foreground/70")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
