"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Car, EnvelopeSimple, Lock, ArrowRight, Warning } from "@phosphor-icons/react";

const inputClass =
  "w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground placeholder:text-on-surface-variant/50 pl-10 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Car size={28} weight="fill" className="text-on-primary-container" />
          </div>
          <h1 className="font-heading text-3xl font-black text-primary leading-none">NoloTrack</h1>
          <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-2">
            Gestione flotta &amp; servizio NCC
          </p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-6">
          <form onSubmit={accedi} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-secondary-container uppercase tracking-widest">Email</label>
              <div className="relative">
                <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="nome@azienda.it"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-secondary-container uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
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
            </div>

            {errore && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <Warning size={14} weight="fill" /> {errore}
              </p>
            )}

            <button
              type="submit"
              disabled={caricamento}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-sm font-bold py-3 rounded-lg transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {caricamento ? "Accesso in corso…" : (
                <>Accedi <ArrowRight size={15} weight="bold" /></>
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-container-low px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Oppure continua con
              </span>
            </div>
          </div>

          <button
            onClick={accediConGoogle}
            className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest border border-border-subtle text-sm text-foreground font-medium py-2.5 rounded-lg transition-colors hover:bg-surface-container-high"
          >
            <GoogleIcon />
            Accedi con Google
          </button>
        </div>

        <p className="text-center text-xs text-on-surface-variant/60 mt-6">
          © {new Date().getFullYear()} NoloTrack
        </p>
      </div>
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
