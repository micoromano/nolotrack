"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      setErrore("Email o password errati.");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">NoloTrack</CardTitle>
          <p className="text-sm text-muted-foreground">Gestione NCC</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={accedi} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {errore && <p className="text-sm text-red-500">{errore}</p>}
            <Button type="submit" className="w-full" disabled={caricamento}>
              {caricamento ? "Accesso..." : "Accedi"}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-white px-2">oppure</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={accediConGoogle}>
            Accedi con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
