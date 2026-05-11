"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const voci = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/turni", label: "Turni" },
  { href: "/dashboard/corse", label: "Corse" },
  { href: "/dashboard/report", label: "Report" },
];

export default function NavBar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function esci() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">NoloTrack</span>
          <nav className="flex gap-1">
            {voci.map((v) => (
              <Link
                key={v.href}
                href={v.href}
                className={cn(
                  "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                  pathname === v.href
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {v.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block">{userEmail}</span>
          <Button variant="outline" size="sm" onClick={esci}>
            Esci
          </Button>
        </div>
      </div>
    </header>
  );
}
