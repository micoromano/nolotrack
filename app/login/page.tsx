"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function accedi(e: React.FormEvent) {
    e.preventDefault();
    setCaricamento(true);
    setErrore("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrore("Credenziali non valide.");
      setCaricamento(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function accediConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-80 bg-sidebar border-r border-border flex-col justify-between p-8 shrink-0">
        <div>
          <span className="font-heading italic text-primary text-2xl">NoloTrack</span>
          <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest">Gestione NCC</p>
        </div>
        <div className="space-y-4">
          <FeatureRow icon="🗓️" text="Registra turni e corse" />
          <FeatureRow icon="💶" text="Tieni traccia degli incassi" />
          <FeatureRow icon="📄" text="Genera report PDF mensili" />
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} NoloTrack</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Accedi a NoloTrack</h1>
            <p className="text-sm text-muted-foreground mt-1">Inserisci le tue credenziali per continuare.</p>
          </div>

          <form onSubmit={accedi} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nome@email.com"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
            <button
              type="submit"
              disabled={caricamento}
              className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {caricamento ? "Accesso in corso…" : "Accedi"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">oppure</span>
            </div>
          </div>

          <button
            onClick={accediConGoogle}
            className="w-full flex items-center justify-center gap-3 bg-card border border-border text-sm text-foreground font-medium py-2.5 rounded-lg transition-colors hover:bg-muted"
          >
            <GoogleIcon />
            Accedi con Google
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const inputClass =
  "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
