import { createClient } from "@/lib/supabase/server";

export type Sezione =
  | "home" | "turni" | "corse" | "cassa" | "spese"
  | "carburante" | "stipendio" | "report" | "invia"
  | "agenda" | "admin" | "whatsapp";

export interface Permessi {
  [sezione: string]: { can_view: boolean; can_edit: boolean };
}

export async function getPermessiUtente(): Promise<Permessi> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const [autistaRes] = await Promise.allSettled([
    supabase.from("autisti").select("ruolo_id, ruoli(nome)").eq("id", user.id).single(),
  ]);

  const autista = autistaRes.status === "fulfilled" ? autistaRes.value.data : null;

  if (!autista?.ruolo_id) {
    return defaultAutistaPermessi();
  }

  const ruoliRaw = autista.ruoli as unknown;
  const nomeRuolo: string | undefined = Array.isArray(ruoliRaw)
    ? (ruoliRaw[0] as { nome: string } | undefined)?.nome
    : (ruoliRaw as { nome: string } | null)?.nome;

  const [permessiRes] = await Promise.allSettled([
    supabase.from("ruolo_permessi").select("sezione, can_view, can_edit").eq("ruolo_id", autista.ruolo_id),
  ]);

  const righe = permessiRes.status === "fulfilled" ? permessiRes.value.data ?? [] : [];

  // Fallback per ruolo noto ma tabella permessi non ancora popolata
  if (righe.length === 0) {
    if (nomeRuolo === "admin") return defaultAdminPermessi();
    return defaultAutistaPermessi();
  }

  const result: Permessi = {};
  for (const p of righe) {
    result[p.sezione] = { can_view: p.can_view, can_edit: p.can_edit };
  }
  return result;
}

function defaultAutistaPermessi(): Permessi {
  const sezioni: Sezione[] = ["home", "turni", "corse", "cassa", "spese", "carburante", "stipendio", "report", "invia", "agenda", "whatsapp"];
  const result: Permessi = {};
  for (const s of sezioni) result[s] = { can_view: true, can_edit: true };
  result["admin"] = { can_view: false, can_edit: false };
  return result;
}

function defaultAdminPermessi(): Permessi {
  const sezioni: Sezione[] = ["home", "turni", "corse", "cassa", "spese", "carburante", "stipendio", "report", "invia", "agenda", "admin", "whatsapp"];
  const result: Permessi = {};
  for (const s of sezioni) result[s] = { can_view: true, can_edit: true };
  return result;
}

export function puoVedere(permessi: Permessi, sezione: Sezione): boolean {
  return permessi[sezione]?.can_view ?? false;
}

export function puoModificare(permessi: Permessi, sezione: Sezione): boolean {
  return permessi[sezione]?.can_edit ?? false;
}
