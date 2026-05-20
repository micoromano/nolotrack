"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
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
  colOra: { width: "10%" },
  colCliente: { width: "25%" },
  colServizio: { width: "40%" },
  colImporto: { width: "12.5%", textAlign: "right" },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#555" },
  badge: {
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: "#f0f0f0",
    color: "#333",
  },
  badgeCash: { backgroundColor: "#fef3c7", color: "#92400e" },
  badgeCarta: { backgroundColor: "#dbeafe", color: "#1e40af" },
  badgeUber: { backgroundColor: "#f3f4f6", color: "#374151" },
  badgeNoInc: { backgroundColor: "#ede9fe", color: "#6d28d9" },
  corsaCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 3,
    marginBottom: 4,
  },
  corsaHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  corsaBody: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  corsaLine: {
    flexDirection: "row",
    marginBottom: 2,
  },
  corsaLineLabel: {
    width: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0078d4",
    fontSize: 8,
  },
  corsaLineValue: {
    flex: 1,
    fontSize: 8,
    color: "#1a1a1a",
  },
  totaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  saldoBox: {
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
});

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function badgeStyle(tipo: string) {
  if (tipo === "cash") return styles.badgeCash;
  if (tipo === "carta") return styles.badgeCarta;
  if (tipo === "uber") return styles.badgeUber;
  return styles.badgeNoInc;
}

function badgeLabel(tipo: string) {
  if (tipo === "cash") return "Cash";
  if (tipo === "carta") return "Carta";
  if (tipo === "uber") return "Uber";
  return "No Inc";
}

interface Corsa {
  ora_partenza: string;
  origine: string;
  destinazione: string;
  tipo_pagamento: string;
  importo: number;
  note?: string | null;
}

interface SpesaItem {
  descrizione: string;
  importo: number;
}

export interface Props {
  data: string;
  turno: { ora_inizio: string; ora_fine: string; ore_lavorate: number } | null;
  corse: Corsa[];
  spese: SpesaItem[];
  totCash: number;
  totCarte: number;
  totUber: number;
  totNonInc: number;
  totSpese: number;
  saldoPrev: number;
  saldoOggi: number;
  dataPrev: string;
}

export function RapportinoDoc({
  data, turno, corse, spese,
  totCash, totCarte, totUber, totNonInc, totSpese,
  saldoPrev, saldoOggi, dataPrev,
}: Props) {
  const dataFmt = new Date(data + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
          {turno ? (
            <View>
              <View style={styles.row}>
                <Text style={styles.label}>Ora inizio</Text>
                <Text style={styles.value}>{turno.ora_inizio.slice(0, 5)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ora fine</Text>
                <Text style={styles.value}>{turno.ora_fine.slice(0, 5)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Totale ore</Text>
                <Text style={styles.valueAccent}>{formatOre(turno.ore_lavorate)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.label}>Nessun turno registrato</Text>
          )}
        </View>

        {/* Flussi */}
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
          <View style={styles.saldoBox}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: "#0078d4" }}>
              Cassa al {new Date(data + "T00:00:00").toLocaleDateString("it-IT")}
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
        {spese.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spese</Text>
            <View style={styles.table}>
              {spese.map((s, i) => (
                <View key={i} style={i < spese.length - 1 ? styles.tableRow : styles.tableRowLast}>
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
          <Text style={styles.sectionTitle}>Dettaglio servizi ({corse.length})</Text>
          {corse.length === 0 ? (
            <Text style={styles.label}>Nessuna corsa registrata</Text>
          ) : (
            <View>
              {corse.map((c, i) => (
                <View key={i} style={styles.corsaCard}>
                  <View style={styles.corsaHead}>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
                      {c.ora_partenza.slice(0, 5)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.badge, badgeStyle(c.tipo_pagamento)]}>
                        {badgeLabel(c.tipo_pagamento)}
                      </Text>
                      {c.importo > 0 && (
                        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: "#0078d4" }}>
                          {euro(c.importo)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.corsaBody}>
                    <View style={styles.corsaLine}>
                      <Text style={styles.corsaLineLabel}>Da</Text>
                      <Text style={styles.corsaLineValue}>{c.origine}</Text>
                    </View>
                    <View style={[styles.corsaLine, { marginBottom: c.note ? 2 : 0 }]}>
                      <Text style={styles.corsaLineLabel}>A</Text>
                      <Text style={styles.corsaLineValue}>{c.destinazione}</Text>
                    </View>
                    {c.note && (
                      <View style={[styles.corsaLine, { marginBottom: 0 }]}>
                        <Text style={[styles.corsaLineLabel, { color: "#888" }]}>N</Text>
                        <Text style={[styles.corsaLineValue, { color: "#666", fontSize: 7.5 }]}>
                          {c.note}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {(totCash > 0 || totCarte > 0) && (
                <View style={styles.totaleRow}>
                  <Text style={{ fontFamily: "Helvetica-Bold", flex: 1 }}>Totali incassati</Text>
                  {totCash > 0 && (
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: "#92400e", marginRight: 8 }}>
                      Cash {euro(totCash)}
                    </Text>
                  )}
                  {totCarte > 0 && (
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: "#1e40af" }}>
                      Carte {euro(totCarte)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NoloTrack — Rapportino giornaliero</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export default function PDFButton(props: Props) {
  const fileName = `rapportino_${props.data}.pdf`;
  return (
    <PDFDownloadLink document={<RapportinoDoc {...props} />} fileName={fileName}>
      {({ loading }) => (
        <button
          className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Generazione…" : "↓ Scarica PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
