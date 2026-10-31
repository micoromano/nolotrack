# Manuale d'uso — NoloTrack

NoloTrack sostituisce il foglio Excel (BASE_CALCOLI + rapportino) per la
gestione quotidiana del servizio NCC: turni, corse, cassa, spese, carburante,
stipendio, report ed email.

Funziona dal browser (computer, tablet, telefono) e dall'app Android/iOS.

---

## Accesso

1. Apri l'indirizzo dell'app → **Accedi**.
2. Inserisci email e password, oppure **Accedi con Google** (se attivato).
3. Per uscire: **Disconnetti**, in fondo alla barra laterale.

Gli account li crea l'amministratore: non c'è una registrazione libera. Se
ricevi un invito via email, apri il link e imposta la tua password.

**Navigazione**: su computer la barra laterale a sinistra; su telefono le
schede in basso (Home, Corse, Cassa, Stipendio, Invia), scorrevoli per le altre
voci. Il selettore **Scuro / Chiaro / Sistema** cambia il tema.

---

## La giornata tipo

1. **Inizio giornata** → *Turni* → **Nuovo turno** (o modifica quello di oggi).
2. **Dopo ogni servizio** → *Corse* → **Nuova corsa**.
3. **Spese in contanti** (parcheggi, lavaggio…) → *Spese*.
4. **Rifornimento** → *Carburante*.
5. **Fine giornata** → *Report* per il rapportino; *Invia* per mandarlo via email.

---

## Home

Il riepilogo del giorno: turno di oggi, corse di oggi, incassi del mese
confrontati con il mese precedente e ultime corse.

## Turni

Elenco dei turni con totali (numero turni, ore lavorate, media ore per turno).

- **Filtro per mese**: menu in alto. Di default c'è il mese corrente; *Ultimi
  30 turni* mostra gli ultimi registrati senza filtro.
- **PDF**: scarica il registro turni del mese selezionato (giorno, data,
  inizio, fine, ore, note e totale). Disponibile quando è selezionato un mese.
- **Nuovo turno**: data, ora di inizio, ora di fine, note. Un solo turno per
  giorno: salvare di nuovo la stessa data aggiorna il turno esistente.
- Tocca un turno per **modificarlo** o **eliminarlo**.

Le ore sono calcolate in automatico (fine − inizio). L'ora di fine deve essere
successiva a quella di inizio.

## Corse

Ultime corse registrate, con il badge del pagamento.

**Nuova corsa**:

| Campo | Note |
|---|---|
| Data, ora partenza, ora fine | |
| Origine, destinazione | con suggerimenti degli indirizzi (Google) |
| Tipo pagamento | **Cash**, **Carta**, **Uber**, **Non incassato** |
| Importo | |
| Mancia | separata dall'importo, vedi *Cassa* |
| Valuta e tasso di cambio | per corse in USD/GBP/CHF: il tasso (quanti € vale 1 unità) si inserisce a mano |
| Includi in cassa | se disattivato la corsa resta visibile ma non entra nel saldo |
| Agenzia, riferimento, cliente, telefono, passeggeri, tipo servizio | dati dell'ordine di servizio |

Tocca una corsa per modificarla o eliminarla.

## Cassa

Estratto conto con **saldo progressivo**, filtrabile per mese.

```
saldo di oggi = saldo precedente + incassi cash − spese − mance
```

- **Carta** e **Uber** sono mostrati a parte e **non** entrano nel saldo cassa.
- **Non incassato** è registrato ma escluso dal saldo.
- La **mancia** riduce sempre il saldo, perché l'autista la trattiene in contanti.

## Spese

Uscite di cassa (data, descrizione, importo), filtrabili per mese, con totale.
Tocca una spesa per modificarla o eliminarla.

## Agenda

Calendario mensile dei servizi, giorno per giorno. Funzioni:
- frecce per cambiare mese;
- **Esporta .ics**: file da importare in qualsiasi calendario (Google, Apple, Outlook);
- **Collega Google Calendar** (se configurato dall'amministratore).

## Carburante

Registro rifornimenti: data, targa, km, litri, prezzo al litro, importo. In
alto i totali del mese (spesa, litri, km, media €/L).

Le **targhe** dei veicoli si aggiungono una volta sola e poi si scelgono dal
menu.

## Stipendio

Calcolo della busta paga del mese selezionato:

```
stipendio base  = ore lavorate × tariffa oraria
commissioni     = cash × % cash + carta × % carta + uber × % uber
totale          = stipendio base + commissioni
```

- Le mance e le corse non incassate **non** generano commissioni.
- Il grafico mostra l'andamento giorno per giorno; sotto c'è il dettaglio
  giornaliero.
- **Config** (icona ingranaggio, in alto): tariffa oraria e percentuali (es. `35` per
  35 %).
- **PDF**: riepilogo mensile da stampare o archiviare.

Il mese conta tutti i giorni, dal 1° all'ultimo (31 compreso).

## Report

Il **rapportino giornaliero** (sostituisce il template Excel): turno e ore,
elenco corse, incassi per tipo, spese, flussi di cassa e saldo. Scegli il giorno
e scarica il **PDF**. Da qui puoi anche registrare velocemente una spesa.

## Invia

Invio via email di uno o più PDF per un periodo:

1. scegli il periodo (oggi, settimana, mese, oppure date *Da*/*A*);
2. spunta i documenti: **rapportino giornaliero**, **riepilogo stipendio**,
   **registro carburante**;
3. destinatario e oggetto (il corpo email si genera da solo, con anteprima);
4. **Invia documenti**.

Se compare *Gmail non configurato*, l'amministratore deve impostare l'account
email dell'app.

## WhatsApp

Comunicazione del servizio tramite WhatsApp Business (se configurato):

- **Avvia flusso servizio**: scegli la corsa; ricevi su WhatsApp i bottoni
  ▶️ *Inizio corsa* → 🏁 *Fine corsa* → scelta del pagamento → ✅ *Fine
  servizio*. Ogni tocco aggiorna la corsa nell'app.
- Se la corsa ha il telefono del cliente, il cliente riceve un messaggio di
  cortesia all'inizio e alla fine del servizio.
- **Invia al cliente / messaggio libero**: testo diretto o da template.
- **Template**: messaggi riutilizzabili con segnaposto `{{nome}}`,
  `{{ora}}`…, compilati al momento dell'invio.
- **Storico**: messaggi inviati e ricevuti con lo stato (inviato, consegnato,
  letto, errore).

## Admin (solo amministratori)

- **Utenti**: elenco autisti e ruoli; **Invita** un nuovo utente via email.
- **Ruoli**: cosa può vedere e modificare ciascun ruolo.

| Ruolo | Può |
|---|---|
| **admin** | tutto, compresa la gestione utenti |
| **dispatcher** | corse e agenda; niente cassa, spese, stipendi |
| **autista** | solo i propri dati |

Ogni utente vede **solo i propri** turni, corse, spese e rifornimenti, anche
con lo stesso ruolo.

---

## Notifiche

**Attiva notifiche** (barra laterale) per ricevere conferme sul dispositivo
quando salvi turni e corse. Richiede HTTPS e il consenso del browser.

## Domande frequenti

**Ho sbagliato una corsa/spesa/turno.** Aprila dall'elenco e modificala o
eliminala.

**Il saldo cassa non torna.** Controlla tipo pagamento (solo *Cash* entra nel
saldo), mance e spese del periodo; per le valute estere controlla il tasso.

**Non vedo una sezione.** Dipende dal tuo ruolo: chiedi all'amministratore.

**Ho dimenticato la password.** Chiedi all'amministratore di reimpostarla.
