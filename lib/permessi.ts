import { createClient } from "@/lib/supabase/server";

export type Sezione =
  | "home" | "turni" | "corse" | "cassa" | "spese"
  | "carburante" | "stipendio" | "report" | "invia"
  | "agenda" | "admin";

export interface Permessi {
  [sezione: string]: { can_view: boolean; can_edit: boolean };
}

export async function getPermessiUtente(): Promise<Permessi> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const [autistaRes] = await Promise.allSettled([
    supabase.from("autisti").select("ruolo_id").eq("id", user.id).single(),
  ]);

  const autista = autistaRes.status === "fulfilled" ? autistaRes.value.data : null;

  if (!autista?.ruolo_id) {
    return defaultAutistaPermessi();
  }

  const [permessiRes] = await Promise.allSettled([
    supabase.from("ruolo_permessi").select("sezione, can_view, can_edit").eq("ruolo_id", autista.ruolo_id),
  ]);

  const permessi = permessiRes.status === "fulfilled" ? permessiRes.value.data ?? [] : [];

  const result: Permessi = {};
  for (const p of permessi) {
    result[p.sezione] = { can_view: p.can_view, can_edit: p.can_edit };
  }
  return result;
}

function defaultAutistaPermessi(): Permessi {
  const sezioni: Sezione[] = ["home", "turni", "corse", "cassa", "spese", "carburante", "stipendio", "report", "invia", "agenda"];
  const result: Permessi = {};
  for (const s of sezioni) result[s] = { can_view: true, can_edit: true };
  result["admin"] = { can_view: false, can_edit: false };
  return result;
}

export function puoVedere(permessi: Permessi, sezione: Sezione): boolean {
  return permessi[sezione]?.can_view ?? false;
}

export function puoModificare(permessi: Permessi, sezione: Sezione): boolean {
  return permessi[sezione]?.can_edit ?? false;
}
