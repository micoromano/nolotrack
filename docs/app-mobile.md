# App mobile (Capacitor)

## Architettura scelta

NoloTrack viene distribuito su mobile come **guscio nativo Capacitor che carica
il sito web reale** (`https://nolotrack-....vercel.app` o dominio custom),
**non** come app offline/statica.

Perché: NoloTrack ha pagine server-rendered, API routes (`/api/invia-email`,
`/api/whatsapp/*`) e componenti server che parlano con Supabase. Un export
statico (`next export`) romperebbe la quasi totalità dell'app. Capacitor
invece apre una `WebView` puntata su `server.url` (vedi `capacitor.config.ts`)
e lascia che sia il deploy Vercel esistente a servire tutto — login, sessioni
Supabase, generazione PDF, invio email/WhatsApp funzionano esattamente come
nel browser, senza duplicare logica.

**Conseguenza importante**: l'app mobile funziona solo se il deploy Vercel è
raggiungibile. Non c'è modalità offline. Questo è già lo stato attuale
dell'app (è sempre stata pensata per il browser), quindi non introduce un
nuovo requisito operativo.

Alternative scartate:
- **React Native / rewrite nativo**: avrebbe richiesto riscrivere UI, routing,
  autenticazione e generazione PDF da zero, con costi/tempi molto più alti.
- **Export statico**: incompatibile con le API routes e i server component
  esistenti.

## Cosa è stato scaffoldato

- `capacitor.config.ts` — `appId: com.nolotrack.app`, `appName: NoloTrack`,
  `server.url` letto da `NEXT_PUBLIC_APP_URL` (fallback a un placeholder se la
  env var non è impostata in fase di build), `server.androidScheme: "https"`.
- `android/` — progetto Android nativo completo (Gradle, `MainActivity.java`,
  risorse, `applicationId com.nolotrack.app`). Generato con
  `npx cap add android`.
- `ios/` — progetto Xcode completo (`App.xcodeproj`, `AppDelegate.swift`,
  `Info.plist`, gestione dipendenze via **Swift Package Manager**
  `CapApp-SPM/`, non CocoaPods — questo è il default delle versioni recenti
  di Capacitor). Generato con `npx cap add ios` **direttamente in questo
  sandbox Linux**: la generazione dei file di progetto non richiede Xcode,
  ma per compilare/eseguire l'app serve comunque un Mac con Xcode installato
  (vedi sotto).
- Script npm: `cap:sync`, `cap:open:android`, `cap:open:ios`.

`applicationId`/bundle id `com.nolotrack.app` è un reverse-domain valido fin
da subito, così la pubblicazione futura sugli store non richiede di cambiarlo
(cambiare l'id dopo la prima pubblicazione è complicato/impossibile).

## Build e apertura in locale

Prerequisiti: Node.js, Android Studio (per Android) o Xcode (per iOS, solo
macOS).

```bash
# 1. Imposta l'URL pubblico del deploy (stesso valore di NEXT_PUBLIC_APP_URL
#    documentato in CLAUDE.md)
export NEXT_PUBLIC_APP_URL=https://il-tuo-dominio.vercel.app

# 2. Sincronizza la configurazione Capacitor con i progetti nativi
npm run cap:sync

# 3. Apri il progetto nativo
npm run cap:open:android   # apre Android Studio
npm run cap:open:ios       # apre Xcode (solo su Mac)
```

Da Android Studio/Xcode si può poi lanciare l'app su un emulatore/simulatore
o su un device fisico collegato via USB (per ora solo così: distribuzione
privata/sideload, vedi sezione seguente).

## Aggiungere iOS su Mac (se serve rigenerare da zero)

Il progetto `ios/` è già committato e funzionante. Serve rigenerarlo da zero
solo se viene cancellato o se si aggiorna la major di Capacitor. In quel
caso, su un Mac con Xcode e CocoaPods installati:

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

## Distribuzione privata (sideload) — stato attuale

Per ora l'app **non** viene pubblicata su Google Play / App Store. Si
distribuisce come:
- **Android**: build di un APK/AAB firmato da Android Studio
  (`Build > Generate Signed Bundle / APK`) e installazione diretta sul
  device di Marco (o distribuzione interna es. Firebase App Distribution).
- **iOS**: build ad-hoc/TestFlight interno da Xcode, che richiede comunque un
  Apple Developer account (vedi sotto) — Apple non permette sideload libero
  come Android senza un account developer, nemmeno per uso privato oltre 7
  giorni.

## Cosa serve per pubblicare sugli store in futuro

Quando si deciderà di pubblicare:

- **Google Play**: creare un account Google Play Console (~25€ una tantum),
  compilare la scheda store (descrizione, screenshot, privacy policy — già
  disponibile su `/privacy`), generare un AAB firmato, passare la review.
- **Apple App Store**: iscriversi all'Apple Developer Program (99$/anno),
  creare l'app su App Store Connect con lo stesso bundle id
  `com.nolotrack.app`, generare certificati/profili di firma via Xcode,
  passare la review (più severa di Google sulle web-view "thin wrapper" —
  può essere utile aggiungere qualche funzionalità nativa, es. notifiche
  push già esistenti, per giustificare l'app nativa).

Nessuna modifica strutturale è necessaria per questo passaggio: l'`appId`
reverse-domain, la struttura standard dei progetti `android/`/`ios/` e la
configurazione Capacitor sono già pronti per la pubblicazione.

## Asset ancora da fornire (Marco)

Prima di una build "vera" (anche solo per sideload con un'icona corretta,
non il placeholder generico di Capacitor) servono:

- **Icona app**: un'immagine quadrata **1024×1024px**, PNG, sfondo pieno
  (senza trasparenza per lo store icon), logo NoloTrack centrato con un
  margine di sicurezza (verrà ritagliata a cerchio/squircle su alcuni
  device).
- **Splash screen**: un'immagine (idealmente logo su sfondo scuro coerente
  col tema Azure dell'app, `oklch(0.16 0 0)`), almeno 2732×2732px per coprire
  tutte le densità.
- Una volta forniti questi asset, si useranno gli strumenti standard
  Capacitor (`@capacitor/assets` o equivalenti) per generare tutte le
  risoluzioni richieste da Android e iOS a partire dai due file sorgente.

## Note per Claude / chi tocca questo codice in futuro

- Non convertire il progetto a export statico: romperebbe API routes e
  server components.
- `android/` e `ios/` sono progetti nativi generati da Capacitor: non
  modificarli a mano se non per configurazioni note (icone, splash,
  permessi) — preferire rigenerare via `npx cap sync`/`npx cap add` quando
  possibile.
- `server.url` in `capacitor.config.ts` deve puntare sempre al deploy
  pubblico corrente (`NEXT_PUBLIC_APP_URL`), non a `localhost`.
