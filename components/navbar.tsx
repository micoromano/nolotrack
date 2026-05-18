"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  House, Clock, Car, Wallet, Receipt, FileText, SignOut,
  GasPump, Money, PaperPlaneTilt,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const vociDesktop: { href: string; label: string; icon: PhosphorIcon; color: string }[] = [
  { href: "/dashboard",            label: "Home",      icon: House,           color: "text-primary" },
  { href: "/dashboard/turni",      label: "Turni",     icon: Clock,           color: "text-sky-400" },
  { href: "/dashboard/corse",      label: "Corse",     icon: Car,             color: "text-emerald-400" },
  { href: "/dashboard/cassa",      label: "Cassa",     icon: Wallet,          color: "text-amber-400" },
  { href: "/dashboard/spese",      label: "Spese",     icon: Receipt,         color: "text-rose-400" },
  { href: "/dashboard/carburante", label: "Carburante",icon: GasPump,         color: "text-orange-400" },
  { href: "/dashboard/stipendio",  label: "Stipendio", icon: Money,           color: "text-green-400" },
  { href: "/dashboard/report",     label: "Report",    icon: FileText,        color: "text-violet-400" },
  { href: "/dashboard/invia",      label: "Invia",     icon: PaperPlaneTilt,  color: "text-cyan-400" },
];

// Mobile: le 5 voci più usate quotidianamente
const vociMobile = [
  vociDesktop[0], // Home
  vociDesktop[2], // Corse
  vociDesktop[3], // Cassa
  vociDesktop[6], // Stipendio
  vociDesktop[8], // Invia
];

export default function NavBar({ userEmail }: { userEmail: string }) {
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

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-56 bg-sidebar border-r border-sidebar-border flex-col z-40">
        <div className="h-12 flex items-center px-4 border-b border-sidebar-border shrink-0">
          <span className="font-heading italic text-primary text-xl tracking-tight">NoloTrack</span>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {vociDesktop.map(({ href, label, icon: Icon, color }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative group",
                  active
                    ? "text-foreground bg-sidebar-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-r" />
                )}
                <span className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                  active ? cn("bg-sidebar-accent", color) : "text-muted-foreground group-hover:text-foreground"
                )}>
                  <Icon size={16} weight={active ? "fill" : "regular"} />
                </span>
                <span className={cn("font-medium", active && "text-foreground")}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 shrink-0 space-y-1">
          <div className="px-0 pb-2">
            <select
              value={theme ?? "dark"}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-sidebar-accent border border-sidebar-border text-xs text-muted-foreground px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="dark">🌙 Scuro</option>
              <option value="light">☀️ Chiaro</option>
              <option value="system">💻 Sistema</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground px-1 truncate">{userEmail}</p>
          <button
            onClick={esci}
            className="flex items-center gap-2 w-full px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded"
          >
            <SignOut size={13} weight="bold" />
            Disconnetti
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        <span className="font-heading italic text-primary text-lg">NoloTrack</span>
        <div className="flex items-center gap-2">
          <select
            value={theme ?? "dark"}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-transparent text-muted-foreground text-xs border-none focus:outline-none"
          >
            <option value="dark">🌙</option>
            <option value="light">☀️</option>
            <option value="system">💻</option>
          </select>
          <button onClick={esci} className="text-muted-foreground p-1">
            <SignOut size={18} weight="bold" />
          </button>
        </div>
      </header>

      {/* Mobile bottom tabs */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          {vociMobile.map(({ href, label, icon: Icon, color }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all relative pt-1",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {active && (
                  <span className="absolute top-0 left-4 right-4 h-0.5 bg-primary rounded-b" />
                )}
                <span className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                  active ? cn("bg-sidebar-accent", color) : ""
                )}>
                  <Icon size={20} weight={active ? "fill" : "regular"} />
                </span>
                <span className={cn("text-[10px] font-semibold leading-none", active ? "text-foreground" : "text-muted-foreground/70")}>
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
