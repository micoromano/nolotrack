import { pdf, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(blob);
  });
}

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function dataitIT(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────
const sharedStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 32,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: "#0078d4",
    paddingBottom: 8,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0078d4" },
  headerSub: { fontSize: 9, color: "#666" },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0078d4",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 3,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: "#555" },
  value: { fontFamily: "Helvetica-Bold" },
  valueAccent: { fontFamily: "Helvetica-Bold", color: "#0078d4" },
  table: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 2 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableRowLast: { flexDirection: "row", padding: 5 },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#555" },
  totaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#aaa" },
  accentBox: {
    borderWidth: 1,
    borderColor: "#0078d4",
    borderRadius: 3,
    padding: 8,
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
  },
});

// ─────────────────────────────────────────────────────
// 1. Rapportino multi-giorno
// ─────────────────────────────────────────────────────
export async function generaPDFRapportino(
  userId: string,
  dataInizio: string,
  dataFine: string
): Promise<{ filename: string; content: string }> {
  const supabase = createClient();

  // Enumerate days in range
  const giorni: string[] = [];
  const cur = new Date(dataInizio + "T00:00:00");
  const end = new Date(dataFine + "T00:00:00");
  while (cur <= end) {
    giorni.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }

  // Fetch all data in parallel per day
  type GiornoData = {
    data: string;
    turno: { ora_inizio: string; ora_fine: string; ore_lavorate: number } | null;
    corse: Array<{
      ora_partenza: string;
      origine: string;
      destinazione: string;
      tipo_pagamento: string;
      importo: number;
      note?: string | null;
    }>;
    spese: Array<{ descrizione: string; importo: number }>;
  };

  const results: GiornoData[] = [];

  for (const giorno of giorni) {
    const [turnoRes, corseRes, speseRes] = await Promise.allSettled([
      supabase.from("turni").select("*").eq("autista_id", userId).eq("data", giorno).maybeSingle(),
      supabase.from("corse").select("*").eq("autista_id", userId).eq("data", giorno).order("ora_partenza"),
      supabase.from("spese").select("*").eq("autista_id", userId).eq("data", giorno),
    ]);

    const turno = turnoRes.status === "fulfilled" ? turnoRes.value.data : null;
    const corse = corseRes.status === "fulfilled" ? (corseRes.value.data ?? []) : [];
    const spese = speseRes.status === "fulfilled" ? (speseRes.value.data ?? []) : [];

    if (!turno && corse.length === 0 && spese.length === 0) continue;

    results.push({ data: giorno, turno, corse, spese });
  }

  // Build a single Document with one <Page> per day.
  const styles = StyleSheet.create({
    page: sharedStyles.page,
    header: sharedStyles.header,
    headerTitle: sharedStyles.headerTitle,
    headerSub: sharedStyles.headerSub,
    section: sharedStyles.section,
    sectionTitle: sharedStyles.sectionTitle,
    row: sharedStyles.row,
    label: sharedStyles.label,
    value: sharedStyles.value,
    valueAccent: sharedStyles.valueAccent,
    table: sharedStyles.table,
    tableHeader: sharedStyles.tableHeader,
    tableRow: sharedStyles.tableRow,
    tableRowLast: sharedStyles.tableRowLast,
    th: sharedStyles.th,
    totaleRow: sharedStyles.totaleRow,
    footer: sharedStyles.footer,
    footerText: sharedStyles.footerText,
    accentBox: sharedStyles.accentBox,
  });

  // Calculate running cash balance
  let saldoCorrente = 0;

  const pages = results.map((g, idx) => {
    const totCash = g.corse
      .filter((c) => c.tipo_pagamento === "cash")
      .reduce((s, c) => s + c.importo, 0);
    const totCarte = g.corse
      .filter((c) => c.tipo_pagamento === "carta")
      .reduce((s, c) => s + c.importo, 0);
    const totUber = g.corse
      .filter((c) => c.tipo_pagamento === "uber")
      .reduce((s, c) => s + c.importo, 0);
    const totNonInc = g.corse
      .filter((c) => c.tipo_pagamento === "noninc")
      .reduce((s, c) => s + c.importo, 0);
    const totSpese = g.spese.reduce((s, sp) => s + sp.importo, 0);

    const saldoPrev = saldoCorrente;
    const dataPrev = idx === 0 ? g.data : results[idx - 1].data;
    saldoCorrente = saldoPrev + totCash - totSpese;
    const saldoOggi = saldoCorrente;

    const dataFmt = new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <Page key={g.data} size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Rapportino</Text>
            <Text style={styles.headerSub}>NoloTrack — Gestione NCC</Text>
          </View>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "capitalize" }}>
            {dataFmt}
          </Text>
        </View>

        {/* Orari */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orari</Text>
          {g.turno ? (
            <View>
              <View style={styles.row}>
                <Text style={styles.label}>Ora inizio</Text>
                <Text style={styles.value}>{g.turno.ora_inizio.slice(0, 5)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ora fine</Text>
                <Text style={styles.value}>{g.turno.ora_fine.slice(0, 5)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Totale ore</Text>
                <Text style={styles.valueAccent}>{formatOre(g.turno.ore_lavorate)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.label}>Nessun turno registrato</Text>
          )}
        </View>

        {/* Flussi cassa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flussi cassa</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cassa al {new Date(dataPrev + "T00:00:00").toLocaleDateString("it-IT")}</Text>
            <Text style={styles.value}>{euro(saldoPrev)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Entrate cash</Text>
            <Text style={styles.value}>{euro(totCash)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Uscite (spese)</Text>
            <Text style={styles.value}>− {euro(totSpese)}</Text>
          </View>
          <View style={styles.accentBox}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: "#0078d4" }}>
              Cassa al {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT")}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0078d4" }}>
              {euro(saldoOggi)}
            </Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <View style={styles.row}>
              <Text style={styles.label}>Carte</Text>
              <Text style={styles.value}>{euro(totCarte)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Uber</Text>
              <Text style={styles.value}>{euro(totUber)}</Text>
            </View>
            {totNonInc > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Non incassato</Text>
                <Text style={styles.value}>{euro(totNonInc)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Spese */}
        {g.spese.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spese</Text>
            <View style={styles.table}>
              {g.spese.map((s, i) => (
                <View key={i} style={i < g.spese.length - 1 ? styles.tableRow : styles.tableRowLast}>
                  <Text style={{ flex: 1 }}>{s.descrizione}</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{euro(s.importo)}</Text>
                </View>
              ))}
              <View style={styles.totaleRow}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Totale spese</Text>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{euro(totSpese)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Servizi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dettaglio servizi ({g.corse.length})</Text>
          {g.corse.length === 0 ? (
            <Text style={styles.label}>Nessuna corsa registrata</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[{ width: "10%" }, styles.th]}>Ora</Text>
                <Text style={[{ width: "25%" }, styles.th]}>Tipo</Text>
                <Text style={[{ flex: 1 }, styles.th]}>Tratta</Text>
                <Text style={[{ width: "12.5%", textAlign: "right" }, styles.th]}>Cash</Text>
                <Text style={[{ width: "12.5%", textAlign: "right" }, styles.th]}>Carte</Text>
              </View>
              {g.corse.map((c, i) => (
                <View key={i} style={i < g.corse.length - 1 ? styles.tableRow : styles.tableRowLast}>
                  <Text style={{ width: "10%" }}>{c.ora_partenza.slice(0, 5)}</Text>
                  <Text style={{ width: "25%" }}>{c.tipo_pagamento}</Text>
                  <Text style={{ flex: 1 }}>{c.origine} → {c.destinazione}</Text>
                  <Text style={{ width: "12.5%", textAlign: "right" }}>
                    {c.tipo_pagamento === "cash" ? euro(c.importo) : ""}
                  </Text>
                  <Text style={{ width: "12.5%", textAlign: "right" }}>
                    {c.tipo_pagamento === "carta" ? euro(c.importo) : ""}
                  </Text>
                </View>
              ))}
              <View style={styles.totaleRow}>
                <Text style={{ fontFamily: "Helvetica-Bold", flex: 1 }}>Totali</Text>
                <Text style={{ width: "12.5%", textAlign: "right", fontFamily: "Helvetica-Bold" }}>{euro(totCash)}</Text>
                <Text style={{ width: "12.5%", textAlign: "right", fontFamily: "Helvetica-Bold" }}>{euro(totCarte)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NoloTrack — Rapportino giornaliero</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    );
  });

  // If no days had data, produce a single "empty" page
  const doc =
    pages.length > 0 ? (
      <Document>{pages}</Document>
    ) : (
      <Document>
        <Page size="A4" style={sharedStyles.page}>
          <View style={sharedStyles.header}>
            <View>
              <Text style={sharedStyles.headerTitle}>Rapportino</Text>
              <Text style={sharedStyles.headerSub}>NoloTrack — Gestione NCC</Text>
            </View>
            <Text style={{ fontSize: 9, color: "#666" }}>
              {dataitIT(dataInizio)} – {dataitIT(dataFine)}
            </Text>
          </View>
          <Text style={{ color: "#555", fontSize: 10 }}>
            Nessun dato trovato per il periodo selezionato.
          </Text>
        </Page>
      </Document>
    );

  const blob = await pdf(doc).toBlob();
  const content = await blobToBase64(blob);
  const filename =
    dataInizio === dataFine
      ? `rapportino_${dataInizio}.pdf`
      : `rapportino_${dataInizio}_${dataFine}.pdf`;

  return { filename, content };
}

// ─────────────────────────────────────────────────────
// 2. Stipendio mensile
// ─────────────────────────────────────────────────────
const stipendioStyles = StyleSheet.create({
  page: sharedStyles.page,
  header: sharedStyles.header,
  headerTitle: sharedStyles.headerTitle,
  headerSub: sharedStyles.headerSub,
  section: sharedStyles.section,
  sectionTitle: sharedStyles.sectionTitle,
  row: sharedStyles.row,
  label: sharedStyles.label,
  value: sharedStyles.value,
  valueAccent: sharedStyles.valueAccent,
  table: sharedStyles.table,
  tableHeader: sharedStyles.tableHeader,
  tableRow: sharedStyles.tableRow,
  tableRowLast: sharedStyles.tableRowLast,
  th: sharedStyles.th,
  totaleRow: sharedStyles.totaleRow,
  footer: sharedStyles.footer,
  footerText: sharedStyles.footerText,
  accentBox: sharedStyles.accentBox,
});

interface ConfigSalario {
  tariffa_oraria: number;
  percentuale_cash: number;
  percentuale_carta: number;
  percentuale_uber: number;
}

export async function generaPDFStipendio(
  userId: string,
  dataInizio: string,
  dataFine: string
): Promise<{ filename: string; content: string }> {
  const supabase = createClient();

  const [corseRes, turniRes, configRes] = await Promise.allSettled([
    supabase
      .from("corse")
      .select("*")
      .eq("autista_id", userId)
      .gte("data", dataInizio)
      .lte("data", dataFine),
    supabase
      .from("turni")
      .select("*")
      .eq("autista_id", userId)
      .gte("data", dataInizio)
      .lte("data", dataFine),
    supabase.from("configurazione_salario").select("*").limit(1).maybeSingle(),
  ]);

  const corse = corseRes.status === "fulfilled" ? (corseRes.value.data ?? []) : [];
  const turni = turniRes.status === "fulfilled" ? (turniRes.value.data ?? []) : [];
  const config: ConfigSalario | null =
    configRes.status === "fulfilled" ? configRes.value.data : null;

  const totCash = corse
    .filter((c: { tipo_pagamento: string }) => c.tipo_pagamento === "cash")
    .reduce((s: number, c: { importo: number }) => s + c.importo, 0);
  const totCarte = corse
    .filter((c: { tipo_pagamento: string }) => c.tipo_pagamento === "carta")
    .reduce((s: number, c: { importo: number }) => s + c.importo, 0);
  const totUber = corse
    .filter((c: { tipo_pagamento: string }) => c.tipo_pagamento === "uber")
    .reduce((s: number, c: { importo: number }) => s + c.importo, 0);
  const oreLavorate = turni.reduce(
    (s: number, t: { ore_lavorate: number }) => s + t.ore_lavorate,
    0
  );

  const stipendioBase = config ? oreLavorate * config.tariffa_oraria : 0;
  const commCash = config ? totCash * config.percentuale_cash : 0;
  const commCarta = config ? totCarte * config.percentuale_carta : 0;
  const commUber = config ? totUber * config.percentuale_uber : 0;
  const totaleStipendio = stipendioBase + commCash + commCarta + commUber;

  const periodoFmt = `${dataitIT(dataInizio)} – ${dataitIT(dataFine)}`;

  const doc = (
    <Document>
      <Page size="A4" style={stipendioStyles.page}>
        {/* Header */}
        <View style={stipendioStyles.header}>
          <View>
            <Text style={stipendioStyles.headerTitle}>Riepilogo Stipendio</Text>
            <Text style={stipendioStyles.headerSub}>NoloTrack — Gestione NCC</Text>
          </View>
          <Text style={{ fontSize: 9, color: "#666" }}>{periodoFmt}</Text>
        </View>

        {/* Riepilogo ore e corse */}
        <View style={stipendioStyles.section}>
          <Text style={stipendioStyles.sectionTitle}>Attività</Text>
          <View style={stipendioStyles.row}>
            <Text style={stipendioStyles.label}>Giorni lavorati</Text>
            <Text style={stipendioStyles.value}>{turni.length}</Text>
          </View>
          <View style={stipendioStyles.row}>
            <Text style={stipendioStyles.label}>Ore totali</Text>
            <Text style={stipendioStyles.valueAccent}>{formatOre(oreLavorate)}</Text>
          </View>
          <View style={stipendioStyles.row}>
            <Text style={stipendioStyles.label}>Corse totali</Text>
            <Text style={stipendioStyles.value}>{corse.length}</Text>
          </View>
        </View>

        {/* Incassi */}
        <View style={stipendioStyles.section}>
          <Text style={stipendioStyles.sectionTitle}>Incassi</Text>
          <View style={stipendioStyles.row}>
            <Text style={stipendioStyles.label}>Cash</Text>
            <Text style={stipendioStyles.value}>{euro(totCash)}</Text>
          </View>
          <View style={stipendioStyles.row}>
            <Text style={stipendioStyles.label}>Carte</Text>
            <Text style={stipendioStyles.value}>{euro(totCarte)}</Text>
          </View>
          <View style={stipendioStyles.row}>
            <Text style={stipendioStyles.label}>Uber</Text>
            <Text style={stipendioStyles.value}>{euro(totUber)}</Text>
          </View>
          <View style={[stipendioStyles.row, { marginTop: 4 }]}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Totale incassato</Text>
            <Text style={stipendioStyles.valueAccent}>{euro(totCash + totCarte + totUber)}</Text>
          </View>
        </View>

        {/* Calcolo stipendio */}
        {config && (
          <View style={stipendioStyles.section}>
            <Text style={stipendioStyles.sectionTitle}>Calcolo stipendio</Text>
            <View style={stipendioStyles.table}>
              <View style={stipendioStyles.tableHeader}>
                <Text style={[{ flex: 1 }, stipendioStyles.th]}>Voce</Text>
                <Text style={[{ width: "30%", textAlign: "right" }, stipendioStyles.th]}>Base</Text>
                <Text style={[{ width: "15%", textAlign: "right" }, stipendioStyles.th]}>%</Text>
                <Text style={[{ width: "25%", textAlign: "right" }, stipendioStyles.th]}>Importo</Text>
              </View>
              {/* Ore */}
              <View style={stipendioStyles.tableRow}>
                <Text style={{ flex: 1 }}>Tariffa oraria</Text>
                <Text style={{ width: "30%", textAlign: "right" }}>{formatOre(oreLavorate)}</Text>
                <Text style={{ width: "15%", textAlign: "right" }}>
                  {euro(config.tariffa_oraria)}/h
                </Text>
                <Text style={{ width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold" }}>
                  {euro(stipendioBase)}
                </Text>
              </View>
              {/* Cash */}
              <View style={stipendioStyles.tableRow}>
                <Text style={{ flex: 1 }}>Commissione cash</Text>
                <Text style={{ width: "30%", textAlign: "right" }}>{euro(totCash)}</Text>
                <Text style={{ width: "15%", textAlign: "right" }}>
                  {(config.percentuale_cash * 100).toFixed(1)}%
                </Text>
                <Text style={{ width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold" }}>
                  {euro(commCash)}
                </Text>
              </View>
              {/* Carte */}
              <View style={stipendioStyles.tableRow}>
                <Text style={{ flex: 1 }}>Commissione carte</Text>
                <Text style={{ width: "30%", textAlign: "right" }}>{euro(totCarte)}</Text>
                <Text style={{ width: "15%", textAlign: "right" }}>
                  {(config.percentuale_carta * 100).toFixed(1)}%
                </Text>
                <Text style={{ width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold" }}>
                  {euro(commCarta)}
                </Text>
              </View>
              {/* Uber */}
              <View style={stipendioStyles.tableRowLast}>
                <Text style={{ flex: 1 }}>Commissione Uber</Text>
                <Text style={{ width: "30%", textAlign: "right" }}>{euro(totUber)}</Text>
                <Text style={{ width: "15%", textAlign: "right" }}>
                  {(config.percentuale_uber * 100).toFixed(1)}%
                </Text>
                <Text style={{ width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold" }}>
                  {euro(commUber)}
                </Text>
              </View>
              <View style={stipendioStyles.totaleRow}>
                <Text style={{ fontFamily: "Helvetica-Bold", flex: 1 }}>Totale stipendio</Text>
                <Text
                  style={{
                    width: "25%",
                    textAlign: "right",
                    fontFamily: "Helvetica-Bold",
                    color: "#0078d4",
                    fontSize: 11,
                  }}
                >
                  {euro(totaleStipendio)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!config && (
          <View style={stipendioStyles.section}>
            <Text style={{ color: "#555", fontStyle: "italic" }}>
              Nessuna configurazione salario trovata. Accedi alla sezione Stipendio per impostare
              tariffa oraria e percentuali.
            </Text>
          </View>
        )}

        {/* Totale riepilogativo */}
        <View style={stipendioStyles.accentBox}>
          <Text style={{ fontFamily: "Helvetica-Bold", color: "#0078d4" }}>
            Stipendio totale — {periodoFmt}
          </Text>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0078d4" }}>
            {euro(totaleStipendio)}
          </Text>
        </View>

        {/* Footer */}
        <View style={stipendioStyles.footer} fixed>
          <Text style={stipendioStyles.footerText}>NoloTrack — Riepilogo stipendio</Text>
          <Text
            style={stipendioStyles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const content = await blobToBase64(blob);
  const filename = `stipendio_${dataInizio}_${dataFine}.pdf`;

  return { filename, content };
}

// ─────────────────────────────────────────────────────
// 3. Registro carburante
// ─────────────────────────────────────────────────────
const carbStyles = StyleSheet.create({
  page: sharedStyles.page,
  header: sharedStyles.header,
  headerTitle: sharedStyles.headerTitle,
  headerSub: sharedStyles.headerSub,
  section: sharedStyles.section,
  sectionTitle: sharedStyles.sectionTitle,
  row: sharedStyles.row,
  label: sharedStyles.label,
  value: sharedStyles.value,
  valueAccent: sharedStyles.valueAccent,
  table: sharedStyles.table,
  tableHeader: sharedStyles.tableHeader,
  tableRow: sharedStyles.tableRow,
  tableRowLast: sharedStyles.tableRowLast,
  th: sharedStyles.th,
  totaleRow: sharedStyles.totaleRow,
  footer: sharedStyles.footer,
  footerText: sharedStyles.footerText,
  accentBox: sharedStyles.accentBox,
});

export async function generaPDFCarburante(
  userId: string,
  dataInizio: string,
  dataFine: string
): Promise<{ filename: string; content: string }> {
  const supabase = createClient();

  const { data } = await supabase
    .from("carburante")
    .select("*")
    .eq("autista_id", userId)
    .gte("data", dataInizio)
    .lte("data", dataFine)
    .order("data");

  const rifornimenti: Array<{
    data: string;
    litri?: number | null;
    importo: number;
    note?: string | null;
  }> = data ?? [];

  const totCosto = rifornimenti.reduce((s, r) => s + r.importo, 0);
  const totLitri = rifornimenti.reduce((s, r) => s + (r.litri ?? 0), 0);
  const periodoFmt = `${dataitIT(dataInizio)} – ${dataitIT(dataFine)}`;

  const doc = (
    <Document>
      <Page size="A4" style={carbStyles.page}>
        {/* Header */}
        <View style={carbStyles.header}>
          <View>
            <Text style={carbStyles.headerTitle}>Registro Carburante</Text>
            <Text style={carbStyles.headerSub}>NoloTrack — Gestione NCC</Text>
          </View>
          <Text style={{ fontSize: 9, color: "#666" }}>{periodoFmt}</Text>
        </View>

        {/* Riepilogo */}
        <View style={carbStyles.section}>
          <Text style={carbStyles.sectionTitle}>Riepilogo</Text>
          <View style={carbStyles.row}>
            <Text style={carbStyles.label}>Rifornimenti</Text>
            <Text style={carbStyles.value}>{rifornimenti.length}</Text>
          </View>
          {totLitri > 0 && (
            <View style={carbStyles.row}>
              <Text style={carbStyles.label}>Litri totali</Text>
              <Text style={carbStyles.value}>{totLitri.toFixed(2)} L</Text>
            </View>
          )}
          <View style={carbStyles.row}>
            <Text style={carbStyles.label}>Costo totale</Text>
            <Text style={carbStyles.valueAccent}>{euro(totCosto)}</Text>
          </View>
        </View>

        {/* Tabella rifornimenti */}
        <View style={carbStyles.section}>
          <Text style={carbStyles.sectionTitle}>Dettaglio rifornimenti</Text>
          {rifornimenti.length === 0 ? (
            <Text style={carbStyles.label}>Nessun rifornimento registrato nel periodo.</Text>
          ) : (
            <View style={carbStyles.table}>
              <View style={carbStyles.tableHeader}>
                <Text style={[{ width: "22%" }, carbStyles.th]}>Data</Text>
                <Text style={[{ width: "20%", textAlign: "right" }, carbStyles.th]}>Litri</Text>
                <Text style={[{ width: "22%", textAlign: "right" }, carbStyles.th]}>Importo</Text>
                <Text style={[{ flex: 1 }, carbStyles.th]}>Note</Text>
              </View>
              {rifornimenti.map((r, i) => (
                <View
                  key={i}
                  style={i < rifornimenti.length - 1 ? carbStyles.tableRow : carbStyles.tableRowLast}
                >
                  <Text style={{ width: "22%" }}>{dataitIT(r.data)}</Text>
                  <Text style={{ width: "20%", textAlign: "right" }}>
                    {r.litri != null ? `${r.litri.toFixed(2)} L` : "—"}
                  </Text>
                  <Text style={{ width: "22%", textAlign: "right", fontFamily: "Helvetica-Bold" }}>
                    {euro(r.importo)}
                  </Text>
                  <Text style={{ flex: 1 }}>{r.note ?? ""}</Text>
                </View>
              ))}
              <View style={carbStyles.totaleRow}>
                <Text style={{ fontFamily: "Helvetica-Bold", flex: 1 }}>Totale</Text>
                {totLitri > 0 && (
                  <Text style={{ width: "20%", textAlign: "right", fontFamily: "Helvetica-Bold" }}>
                    {totLitri.toFixed(2)} L
                  </Text>
                )}
                {totLitri === 0 && <Text style={{ width: "20%" }} />}
                <Text
                  style={{
                    width: "22%",
                    textAlign: "right",
                    fontFamily: "Helvetica-Bold",
                    color: "#0078d4",
                  }}
                >
                  {euro(totCosto)}
                </Text>
                <Text style={{ flex: 1 }} />
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={carbStyles.footer} fixed>
          <Text style={carbStyles.footerText}>NoloTrack — Registro carburante</Text>
          <Text
            style={carbStyles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const content = await blobToBase64(blob);
  const filename = `carburante_${dataInizio}_${dataFine}.pdf`;

  return { filename, content };
}
