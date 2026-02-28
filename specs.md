# Timeo — Architecture & Claude Code Prompts

## 1. Cos'è Timeo

Un software web che permette di studiare e interpretare processi attraverso eventi organizzati cronologicamente, disposti su timeline gerarchiche (contesti) e messi in relazione tra loro.

## 2. Scope MVP

Il primo MVP è un **viewer/explorer read-only** di timeline. I dati vengono creati e gestiti interamente dentro DatoCMS (admin UI). Il frontend Next.js consuma i dati via GraphQL (Content Delivery API) e li visualizza.

**Incluso nell'MVP:**
- Homepage con lista delle timeline root (Context senza parent)
- Vista orizzontale della timeline con zoom/pan
- Sidebar sinistra con albero dei contesti (navigazione gerarchica)
- Eventi posizionati sull'asse temporale orizzontale
- Sistema di visibility: regular/main/super (frontend logic basata su zoom level)
- Sub-timeline figlie mostrate come barre sotto la timeline parent
- Click su evento → aside panel destro con dettagli completi
- Click su sub-timeline → navigazione dentro quel contesto
- Eventi con durata (start → end) mostrati come barre
- Responsive (funzionale su desktop, graceful degradation su mobile)

**Escluso dall'MVP:**
- Autenticazione utente (niente Supabase)
- CRUD da frontend (tutto via DatoCMS admin)
- Collaborazione real-time
- Ricerche (feature futura — solo struttura dati predisposta)
- Export (timeline, research, present)
- Vista verticale
- Geolocalizzazione (lat/lon presenti nel data model ma non visualizzati)

## 3. Tech Stack

| Layer | Tecnologia | Motivazione |
|-------|-----------|-------------|
| CMS / Database | DatoCMS | Unico backend per MVP. Tree collections native per i contesti. Structured Text per rich content. Media pipeline. GraphQL API. Preview + Real-time API. |
| Frontend Framework | Next.js 14+ (App Router) | SSR/SSG per performance e SEO sulle timeline pubbliche. Integrazione ufficiale con DatoCMS (react-datocms). API routes per logica futura. |
| UI / Componenti | React + Tailwind CSS | Utility-first styling, buon supporto Claude Code. |
| Animazioni | Framer Motion | Zoom, pan, transizioni tra scale temporali, apertura aside panel. |
| GraphQL Client | @datocms/cda-client | Client ufficiale DatoCMS con supporto cache tags, pagination, draft mode. |
| Immagini | react-datocms `<Image>` | Responsive images con blur-up placeholder (LQIP) gestito automaticamente da DatoCMS. |
| Rich Text | react-datocms `<StructuredText>` | Rendering Structured Text di DatoCMS con supporto blocchi custom. |
| Deployment | Vercel | Deploy automatico, integration nativa con Next.js e DatoCMS (webhooks per rebuild). |

## 4. Data Model DatoCMS

### 4.1 Modello: `Context` (Tree Collection)

Rappresenta una timeline o sotto-timeline. Abilitare **Hierarchical Sorting** nelle impostazioni del modello.

| Campo | Tipo DatoCMS | Required | Note |
|-------|-------------|----------|------|
| `title` | Single-line string | ✅ | Nome della timeline |
| `slug` | Slug (da title) | ✅ | Per URL routing |
| `description` | Structured Text | | Rich text con possibilità di immagini inline |
| `featured_image` | Single asset | | Immagine di copertina del contesto |
| `media` | Asset gallery | | Galleria media aggiuntiva |
| `color` | Color | | Colore identificativo della timeline (hex) |
| `soft_start_year` | Integer | | Anno indicativo di inizio (per timeline vuote, info "soft") |
| `soft_end_year` | Integer | | Anno indicativo di fine |
| `is_concluded` | Boolean | | `true` = storica (ha una fine), `false` = ancora in corso |

La gerarchia (parent/children) è gestita nativamente dalla Tree Collection di DatoCMS (`parent_id`, `position`).

I Context **senza parent** sono le timeline root dell'utente. L'app li mostra come punto di partenza nella UI. Non esiste un record "Universo" nel DB — è un concetto dell'interfaccia.

**Regola fondamentale:** le date effettive di una timeline sono derivate dai suoi eventi. `soft_start_year` e `soft_end_year` sono solo indicativi per timeline ancora vuote. Appena ci sono eventi, il frontend calcola inizio (= primo evento) e fine (= ultimo evento o "present" se `is_concluded` è false).

### 4.2 Modello: `Event`

| Campo | Tipo DatoCMS | Required | Note |
|-------|-------------|----------|------|
| `title` | Single-line string | ✅ | |
| `slug` | Slug (da title) | ✅ | |
| `context` | Single Link → Context | ✅ | A quale timeline appartiene |
| `year` | Integer | ✅ | Supporta range cosmici: da -13.798.000.000 a +22.000.000.000 |
| `month` | Integer | | 1-12. Se assente il frontend assume 1 (gennaio) |
| `day` | Integer | | 1-31. Se assente il frontend assume 1 |
| `time` | Single-line string | | Formato "HH:MM". Opzionale |
| `end_year` | Integer | | Per eventi con durata. Se presente, l'evento ha un range temporale |
| `end_month` | Integer | | |
| `end_day` | Integer | | |
| `description` | Structured Text | | Rich content dell'evento |
| `featured_image` | Single asset | | |
| `media` | Asset gallery | | Video, immagini, audio, documenti |
| `external_links` | JSON | | Array di `{url, label}` |
| `related_events` | Links → Event | | Relazioni cross-timeline (entro la stessa root) |
| `visibility` | Single-line string (enum) | ✅ | `regular` / `main` / `super`. Default: `regular`. Validazione: enum. |
| `event_type` | Single-line string (enum) | ✅ | `event` / `incident` / `key_moment`. Default: `event` |
| `tags` | Links → Tag | | Plurale |
| `custom_fields` | JSON | | Array di `{key, value}` per dati custom |
| `latitude` | Float | | Per feature geo futura |
| `longitude` | Float | | |
| `number` | Integer | | Valore numerico generico per chart futuri |

### 4.3 Modello: `Tag`

| Campo | Tipo DatoCMS | Required | Note |
|-------|-------------|----------|------|
| `name` | Single-line string | ✅ | |
| `slug` | Slug (da name) | ✅ | |
| `color` | Color | | Per badge visivo nell'UI |

### 4.4 Query GraphQL Principali

**Tutte le timeline root (homepage):**
```graphql
query AllRootContexts {
  allContexts(filter: { parent: { exists: false } }, orderBy: position_ASC) {
    id
    title
    slug
    color { hex }
    featuredImage { responsiveImage(imgixParams: {w: 400, h: 250, fit: crop}) { ...imageFields } }
    softStartYear
    softEndYear
    isConcluded
    children {
      id
      title
      slug
      color { hex }
    }
  }
}
```

**Albero completo di un contesto (sidebar):**
```graphql
query ContextTree($rootId: ItemId!) {
  context(filter: { id: { eq: $rootId } }) {
    id
    title
    slug
    color { hex }
    description { value }
    featuredImage { responsiveImage { ...imageFields } }
    softStartYear
    softEndYear
    isConcluded
    children {
      id
      title
      slug
      color { hex }
      softStartYear
      softEndYear
      children {
        id
        title
        slug
        color { hex }
        softStartYear
        softEndYear
        children {
          id
          title
          slug
          color { hex }
        }
      }
    }
  }
}
```

**Eventi di un contesto (timeline view):**
```graphql
query EventsByContext($contextId: ItemId!, $first: IntType = 100, $skip: IntType = 0) {
  allEvents(
    filter: { context: { eq: $contextId } }
    orderBy: year_ASC
    first: $first
    skip: $skip
  ) {
    id
    title
    slug
    year
    month
    day
    time
    endYear
    endMonth
    endDay
    visibility
    eventType
    featuredImage { responsiveImage(imgixParams: {w: 200, h: 200, fit: crop}) { ...imageFields } }
    tags { id name slug color { hex } }
    relatedEvents { id title slug year context { id title } }
  }
  _allEventsMeta(filter: { context: { eq: $contextId } }) {
    count
  }
}
```

**Dettaglio singolo evento (aside panel):**
```graphql
query EventDetail($eventId: ItemId!) {
  event(filter: { id: { eq: $eventId } }) {
    id
    title
    slug
    year
    month
    day
    time
    endYear
    endMonth
    endDay
    visibility
    eventType
    description { value }
    featuredImage { responsiveImage(imgixParams: {w: 600}) { ...imageFields } }
    media { id url title responsiveImage(imgixParams: {w: 400}) { ...imageFields } }
    externalLinks
    relatedEvents { id title slug year month context { id title slug } }
    tags { id name slug color { hex } }
    customFields
    latitude
    longitude
    number
    context { id title slug color { hex } }
  }
}
```

**Fragment condiviso:**
```graphql
fragment imageFields on ResponsiveImage {
  src
  srcSet
  width
  height
  alt
  title
  base64
}
```

## 5. Architettura Frontend

### 5.1 Route Structure (Next.js App Router)

```
app/
├── page.tsx                         # Homepage: lista timeline root
├── timeline/
│   └── [slug]/
│       ├── page.tsx                 # Vista timeline orizzontale
│       └── event/
│           └── [eventSlug]/
│               └── page.tsx         # Deep link a evento (opzionale, redirect a timeline con aside aperto)
├── layout.tsx                       # Root layout
├── globals.css                      # Tailwind
└── lib/
    ├── datocms/
    │   ├── client.ts                # CDA client setup
    │   ├── queries.ts               # Tutte le query GraphQL
    │   └── fragments.ts             # Fragment condivisi
    ├── timeline/
    │   ├── scale.ts                 # Logica di conversione date → pixel, zoom levels
    │   ├── visibility.ts            # Logica visibility (regular/main/super) basata su zoom
    │   └── date-utils.ts            # Utility per date (format, sort, range compute)
    └── types.ts                     # TypeScript types per Context, Event, Tag
```

### 5.2 Componenti Chiave

```
components/
├── timeline/
│   ├── TimelineCanvas.tsx           # Container principale: gestisce zoom, pan, dimensioni
│   ├── TimelineAxis.tsx             # L'asse temporale con labels delle date
│   ├── TimelineBar.tsx              # La barra orizzontale di un contesto
│   ├── SubTimelineBars.tsx          # Le sub-timeline figlie come barre sotto il parent
│   ├── EventMarker.tsx              # Singolo evento (punto o barra se ha durata)
│   ├── EventCluster.tsx             # Raggruppamento di eventi troppo vicini allo zoom attuale
│   ├── ZoomControls.tsx             # +/- e fit-to-view
│   └── PresentMarker.tsx            # Indicatore "oggi" sulla timeline
├── sidebar/
│   ├── ContextTree.tsx              # Albero navigabile dei contesti
│   └── ContextTreeItem.tsx          # Singolo nodo dell'albero (espandibile)
├── detail/
│   ├── EventDetailPanel.tsx         # Aside panel destro con dettagli evento
│   ├── ContextDetailHeader.tsx      # Header con info del contesto attivo
│   └── RelatedEventsList.tsx        # Lista eventi correlati
├── shared/
│   ├── DatoImage.tsx                # Wrapper su react-datocms <Image>
│   └── DatoStructuredText.tsx       # Wrapper su react-datocms <StructuredText>
└── home/
    └── TimelineCard.tsx             # Card per timeline root in homepage
```

### 5.3 Logica Zoom & Scale

Il cuore dell'applicazione. La scala temporale deve mappare un range di anni a pixel sullo schermo.

**Concetti:**
- `viewportStart`: anno sinistro del viewport visibile
- `viewportEnd`: anno destro del viewport visibile
- `pixelsPerYear`: rapporto di zoom attuale
- Lo zoom avviene centrato sul punto del mouse (o centro viewport)
- Il pan è drag orizzontale

**Zoom levels e visibility:**
- Zoom molto lontano (millenni visibili): solo eventi `super`
- Zoom medio (decenni/secoli): eventi `super` + `main`
- Zoom vicino (anni/mesi): tutti gli eventi (`super` + `main` + `regular`)

Le soglie esatte dipendono da `pixelsPerYear` e vanno calibrate sperimentalmente.

**Formattazione asse temporale:**
- Range > 1.000.000 anni → etichette in "X miliardi/milioni di anni fa"
- Range > 1000 anni → etichette per secolo/millennio
- Range > 100 anni → etichette per decennio
- Range > 10 anni → etichette per anno
- Range > 1 anno → etichette per mese
- Range < 1 anno → etichette per giorno/settimana

### 5.4 Gestione State

Per l'MVP, lo state è semplice (no auth, no write):

- **URL state**: contesto attivo (slug), evento selezionato (slug)
- **Local state (React)**: zoom level, viewport position, aside panel open/close
- **Server state (DatoCMS)**: contesti, eventi, tag — cached via Next.js fetch caching

React context o Zustand se serve state condiviso tra timeline e sidebar.

## 6. Setup DatoCMS

### Istruzioni per creare lo schema su DatoCMS manualmente:

1. Creare un nuovo progetto DatoCMS
2. **Modello Tag**: creare per primo (è referenziato da Event)
   - Aggiungere campi: `name` (string, required), `slug` (slug from name), `color` (color)
3. **Modello Context**: creare come **Tree Collection** (Hierarchical Sorting)
   - Nelle Presentation settings → Default collection ordering → "Hierarchical sorting"
   - Aggiungere campi come da tabella 4.1
4. **Modello Event**: creare come collection regolare
   - Aggiungere campi come da tabella 4.2
   - Per `context`: Link field → punta a Context, required
   - Per `visibility`: string con validazione enum (`regular`, `main`, `super`)
   - Per `event_type`: string con validazione enum (`event`, `incident`, `key_moment`)
   - Per `related_events`: Links field → punta a Event
   - Per `tags`: Links field → punta a Tag
   - Per `external_links` e `custom_fields`: JSON field
5. Creare un **API Token** read-only per il frontend (Content Delivery API)

## 7. Sequenza Prompt per Claude Code

I prompt sono progettati per essere eseguiti in sequenza. Ogni prompt produce un deliverable autocontenuto e testabile. Allegare questo documento come contesto a ogni sessione.

---

### PROMPT 0 — Schema DatoCMS via MCP

```
Leggi il documento di architettura allegato (specs.md), sezione 4 (Data Model DatoCMS).

Prima di tutto, verifica se il MCP di DatoCMS è già configurato:
- Esegui `claude mcp list` per vedere i server MCP attivi
- Se "datocms" non è presente, installalo con:
  `claude mcp add --env DATOCMS_API_TOKEN=<valore da .env> datocms -- npx @datocms/mcp@latest`
  Il token si trova nel file `.env` alla voce DATOCMS_API_TOKEN.
- Dopo l'installazione riavvia la sessione per caricare il MCP.

Usa il MCP di DatoCMS per creare l'intero schema nel seguente ordine (le dipendenze richiedono questo ordine):

**1. Modello `Tag`** (sezione 4.3)
- `name` — string, required
- `slug` — slug generato da name, required
- `color` — color

**2. Modello `Context`** come Tree Collection (sezione 4.1)
- Nelle impostazioni del modello: abilitare Hierarchical Sorting (Default collection ordering → Hierarchical sorting)
- `title` — string, required
- `slug` — slug generato da title, required
- `description` — Structured Text
- `featured_image` — Single asset
- `media` — Asset gallery
- `color` — color
- `soft_start_year` — integer
- `soft_end_year` — integer
- `is_concluded` — boolean

**3. Modello `Event`** come collection regolare (sezione 4.2)
- `title` — string, required
- `slug` — slug generato da title, required
- `context` — Single Link → Context, required
- `year` — integer, required
- `month` — integer
- `day` — integer
- `time` — string (formato "HH:MM")
- `end_year` — integer
- `end_month` — integer
- `end_day` — integer
- `description` — Structured Text
- `featured_image` — Single asset
- `media` — Asset gallery
- `external_links` — JSON
- `related_events` — Links (multipli) → Event
- `visibility` — string, required, enum: [regular, main, super], default: regular
- `event_type` — string, required, enum: [event, incident, key_moment], default: event
- `tags` — Links (multipli) → Tag
- `custom_fields` — JSON
- `latitude` — float
- `longitude` — float
- `number` — integer

Dopo ogni modello creato, verifica che i campi siano corretti invocando lo schema via MCP.
Segnala eventuali campi non supportati o errori durante la creazione.
```

---

### PROMPT 1 — Project Scaffolding

```
Leggi il documento di architettura allegato (timeo-architecture.md), sezione 3 (Tech Stack) e sezione 5.1 (Route Structure).

Crea un progetto Next.js 14+ con App Router. Setup:

1. `npx create-next-app@latest timeo --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. Installa dipendenze:
   - `@datocms/cda-client` (GraphQL client)
   - `react-datocms` (Image, StructuredText, useQuerySubscription)
   - `framer-motion`
   - `zustand` (state management leggero)
3. Crea la struttura cartelle come da sezione 5.1 e 5.2 (file vuoti con export placeholder)
4. Configura `lib/datocms/client.ts`:
   - Usa `@datocms/cda-client` con `executeQuery`
   - Token da `process.env.DATOCMS_API_TOKEN` (read-only CDA token)
   - Abilita `includeDrafts` basato su `process.env.DATOCMS_DRAFT_MODE`
5. Crea `lib/datocms/fragments.ts` con il fragment `imageFields` da sezione 4.4
6. Crea `lib/datocms/queries.ts` con tutte le query dalla sezione 4.4
7. Crea `lib/types.ts` con le TypeScript interfaces per Context, Event, Tag mappate al data model sezione 4
8. Crea `.env.local.example` con le variabili necessarie
9. Assicurati che `npm run build` passi senza errori

Non implementare ancora nessuna UI — solo struttura, configurazione e types.
```

---

### PROMPT 2 — Homepage: Lista Timeline Root

```
Leggi il documento di architettura allegato, sezioni 4.4 (query AllRootContexts) e 5.2 (componenti home/).

Implementa la homepage (`app/page.tsx`):

1. Server component che fetcha tutte le timeline root (Context senza parent) da DatoCMS
2. Mostra una griglia di card (`TimelineCard.tsx`):
   - Featured image con react-datocms <Image> e blur-up
   - Titolo della timeline
   - Colore come accento (bordo o badge)
   - Range temporale: se ha eventi mostra "YYYY — YYYY", altrimenti usa soft_start_year/soft_end_year
   - Badge "in corso" o "conclusa" basato su is_concluded
   - Conteggio sub-timeline (children.length)
3. Ogni card linka a `/timeline/[slug]`
4. Layout pulito, moderno, con Tailwind. Sfondo chiaro, card con ombre sottili.
5. Header semplice con logo "Timeo" e eventuale subtitle

Testa con dati reali da DatoCMS (crea almeno 2 Context root di prova nel CMS con qualche evento).
```

---

### PROMPT 3 — Timeline Core: Asse Temporale e Zoom

```
Leggi il documento di architettura allegato, sezione 5.3 (Logica Zoom & Scale).

Implementa il motore della timeline orizzontale. Questo è il componente più critico dell'app.

Crea `lib/timeline/scale.ts`:
- Funzione `yearToPixel(year, viewportStart, pixelsPerYear)` → x position
- Funzione `pixelToYear(x, viewportStart, pixelsPerYear)` → year
- Funzione `getAxisLabels(viewportStart, viewportEnd, viewportWidthPx)` → array di {year, label, x}
  - Le labels si adattano alla scala: "13.8 mld anni fa", "3000 a.C.", "1850", "Mar 2020"
  - Distanza minima tra labels ~100px
- Funzione `getZoomLevelForRange(startYear, endYear)` → pixelsPerYear iniziale

Crea `lib/timeline/date-utils.ts`:
- `formatTimelineDate(year, month?, day?)` → stringa leggibile
- `computeTimelineRange(events[])` → {minYear, maxYear} con padding
- `sortEventsByDate(events[])` → sorted array
- `eventToFractionalYear(event)` → numero decimale (es. 2020.5 per luglio 2020)

Crea `components/timeline/TimelineCanvas.tsx`:
- Componente client che gestisce un div con overflow hidden
- State: viewportStart, viewportEnd (in anni), derivato da zoom + pan
- Mouse wheel → zoom in/out centrato sul cursore
- Mouse drag (o touch drag) → pan orizzontale
- Usa framer-motion per smooth transitions quando zoom cambia
- Renderizza `TimelineAxis.tsx` come child

Crea `components/timeline/TimelineAxis.tsx`:
- Renderizza una linea orizzontale con tick marks e labels
- Le labels si aggiornano in base al viewport (da getAxisLabels)
- Mostra un marker "Present" (anno corrente) con stile distinto

Crea `components/timeline/ZoomControls.tsx`:
- Bottoni +/- e "fit to view" (resetta zoom per vedere tutta la timeline)

Non serve ancora il fetch dei dati — usa dati mock hardcoded per testare.
Esempio mock: una timeline dal 1769 al 1821 (Napoleone) con 6-7 eventi sparsi.
L'obiettivo è che lo zoom, il pan e l'asse funzionino fluidamente.
```

---

### PROMPT 4 — Eventi sulla Timeline

```
Leggi il documento di architettura allegato, sezioni 4.2 (Event) e 5.2 (EventMarker, EventCluster).

Aggiungi gli eventi alla timeline orizzontale.

Crea `components/timeline/EventMarker.tsx`:
- Evento puntuale (senza end_year): renderizza come cerchio/punto sulla linea + label con titolo e data
- Evento con durata (con end_year): renderizza come barra orizzontale con label
- Se ha featured_image, mostra thumbnail nel marker (piccola, tipo 32x32)
- Stile visivo diverso per event_type: event (cerchio), incident (triangolo/diamante), key_moment (stella/cerchio pieno)
- Tooltip on hover con titolo + data completa
- Click → seleziona l'evento (callback onSelect)

Crea `lib/timeline/visibility.ts`:
- `getVisibleEvents(events[], pixelsPerYear)` → filtered array
- Logica: se pixelsPerYear < soglia_bassa → solo `super`
- Se pixelsPerYear tra soglia_bassa e soglia_alta → `super` + `main`
- Se pixelsPerYear > soglia_alta → tutti
- Soglie iniziali da calibrare: suggerisci valori ragionevoli e rendili configurabili

Crea `components/timeline/EventCluster.tsx`:
- Quando due o più eventi sono a meno di ~30px di distanza, raggruppa in cluster
- Il cluster mostra un badge numerico ("3 events")
- Click su cluster → zoom in su quel range temporale

Integra tutto in TimelineCanvas.tsx:
- Fetcha gli eventi (per ora mock) e posizionali sull'asse usando yearToPixel
- Applica visibility filter basato su zoom level corrente
- Applica clustering basato su distanza pixel

Testa con i dati mock di Napoleone dal prompt precedente.
```

---

### PROMPT 5 — Sidebar con Albero Contesti

```
Leggi il documento di architettura allegato, sezioni 4.4 (ContextTree query) e 5.2 (sidebar/).

Implementa la pagina timeline (`app/timeline/[slug]/page.tsx`) con layout a 3 colonne:
- Sidebar sinistra (250px, collassabile): albero contesti
- Centro (flex): timeline orizzontale
- Aside destro (400px, nascosto di default): dettaglio evento

Crea `components/sidebar/ContextTree.tsx`:
- Riceve l'albero completo dei contesti dalla root
- Mostra nodi espandibili/collassabili
- Il contesto attualmente visualizzato è evidenziato
- Ogni nodo mostra: colore (pallino), titolo, range temporale sintetico
- Click su un nodo → naviga a quel contesto (aggiorna URL e timeline)

Crea `components/sidebar/ContextTreeItem.tsx`:
- Singolo nodo dell'albero
- Freccia per espandere/collassare i children
- Indentazione visiva per livello di profondità

Crea `components/detail/ContextDetailHeader.tsx`:
- Mostrato sopra la timeline, sotto il titolo pagina
- Info del contesto attivo: titolo, descrizione breve, range temporale, badge conclusa/in corso
- Color accent dalla proprietà color del contesto

Crea `components/timeline/SubTimelineBars.tsx`:
- Sotto la timeline principale, mostra le sub-timeline figlie come barre orizzontali
- Ogni barra ha il colore del contesto figlio e il titolo
- La posizione e lunghezza dipendono dagli eventi della sotto-timeline (o soft_start/soft_end)
- Click sulla barra → naviga dentro quella sub-timeline

Integra il fetch reale da DatoCMS:
- `app/timeline/[slug]/page.tsx` è un server component che fetcha contesto + albero + eventi
- Passa i dati ai componenti client

Testa con dati reali creati su DatoCMS.
```

---

### PROMPT 6 — Aside Panel Dettaglio Evento

```
Leggi il documento di architettura allegato, sezioni 4.4 (EventDetail query) e 5.2 (detail/).

Implementa il pannello laterale destro per i dettagli di un evento.

Crea `components/detail/EventDetailPanel.tsx`:
- Slide-in da destra con animazione framer-motion
- Mostra tutti i dettagli dell'evento:
  - Titolo grande
  - Badge con nome del contesto parent e colore
  - Data completa (formattata human-readable)
  - Se ha durata: "Da [data] a [data]" con calcolo durata leggibile ("3 anni e 4 mesi")
  - Featured image grande (react-datocms <Image>)
  - Description (react-datocms <StructuredText>)
  - Gallery media (griglia di thumbnail espandibili)
  - Tags come badge colorati
  - Event type badge
  - External links come lista cliccabile
  - Custom fields come tabella key/value
- Sezione "Eventi correlati" (`RelatedEventsList.tsx`):
  - Lista degli eventi in `related_events`
  - Ogni item mostra: titolo, data, contesto di appartenenza
  - Click → seleziona quell'evento (e naviga al suo contesto se diverso)
- Bottone X per chiudere il panel
- URL si aggiorna con il parametro `?event=[slug]` per deep linking

Lo state dell'evento selezionato vive in Zustand store condiviso tra TimelineCanvas (che emette la selezione) e EventDetailPanel (che la consuma).

Crea Zustand store `lib/store.ts`:
- `selectedEventId: string | null`
- `setSelectedEvent(id)`
- `clearSelectedEvent()`
- `sidebarOpen: boolean`
- `toggleSidebar()`
```

---

### PROMPT 7 — Polish, DatoCMS Preview Mode, Deploy

```
Leggi il documento di architettura allegato, sezione 3 (Tech Stack).

Finalizza l'MVP con polish e deploy:

1. **DatoCMS Draft Mode / Preview:**
   - Configura Next.js Draft Mode per preview dei contenuti non pubblicati
   - Crea route handler `app/api/preview/route.ts` che attiva draft mode
   - Crea route handler `app/api/exit-preview/route.ts`
   - Quando draft mode è attivo, le query DatoCMS includono `includeDrafts: true`
   - Aggiungi un banner "Preview Mode" visibile nell'UI

2. **DatoCMS Real-time updates (opzionale):**
   - Usa `useQuerySubscription` di react-datocms per aggiornare la timeline in tempo reale quando i dati cambiano nel CMS
   - Utile durante l'editing: modifico un evento su DatoCMS e lo vedo aggiornarsi live nel frontend

3. **Responsive polish:**
   - La timeline deve funzionare su desktop (priorità) 
   - Su tablet/mobile: sidebar collassata di default, touch gestures per zoom/pan
   - Aside panel full-screen su mobile

4. **Performance:**
   - Next.js static generation per le pagine timeline (revalidate con webhook DatoCMS)
   - Lazy load delle immagini
   - Virtualizzazione degli eventi se > 200 visibili (react-window o simile)

5. **Vercel deploy:**
   - Configura environment variables su Vercel
   - Configura webhook DatoCMS → Vercel deploy hook per rebuild on publish
   - Testa il flow completo: crea evento su DatoCMS → pubblica → sito si aggiorna

6. **Meta & SEO:**
   - Titoli pagina dinamici basati sul contesto
   - Open Graph meta per condivisione social delle timeline
```

---

## 8. Dati di Test Consigliati

Per testare l'MVP, crea su DatoCMS questa struttura:

**Timeline 1: "Napoleone Bonaparte"** (root, concluded)
- Soft start: 1769, soft end: 1821, color: #2196F3
- Sub-timeline: "Periodo Consolare" (1799-1804)
- Sub-timeline: "L'Impero" (1804-1815)
- Sub-timeline: "Matrimonio con Giuseppina" (1796-1809)
- Eventi (nel context root):
  - 1769/08/15 "Nascita" (key_moment, super)
  - 1785/08 "Inizio scuola ufficiali" (event, main)
  - 1795/08 "Prima Campagna d'Italia" (event, main)
  - 1798/05/19 "Campagna d'Egitto" (event, regular)
  - 1804/05/18 "Diventa Imperatore" (key_moment, super)
  - 1815/08/09 "Esilio Sant'Elena" (incident, main)
  - 1821/05/05 "Morte" (key_moment, super)

**Timeline 2: "Cantiere Creativo"** (root, not concluded)
- Soft start: 2007, color: #00BCD4
- Sub-timeline: "Dipendenti"
- Sub-timeline: "DatoCMS" (2016-present)
- Sub-timeline: "Progetti"
- Eventi vari dal 2007 a oggi, mix di visibility levels

**Timeline 3: "Formazione dell'Universo"** (root, concluded)
- Soft start: -13798000000, soft end: -4500000000, color: #9C27B0
- Eventi:
  - -13798000000 "Big Bang" (key_moment, super)
  - -13797000000 "Era dell'Inflazione" (event, main) — con end_year: -13797000000
  - -13300000000 "Prime Stelle" (event, main)
  - -13100000000 "Prime Galassie" (event, regular)
  - -4600000000 "Formazione del Sistema Solare" (key_moment, super)
  - -4500000000 "Formazione della Terra" (key_moment, super)

Questo set testa: scale umane, scale cosmiche, eventi con/senza durata, sub-timeline, tutti i livelli di visibility, tutti gli event types.

## 9. Note per il Futuro (post-MVP)

- **Auth + multi-utente**: Supabase Auth con OAuth Google → migrazione dati utente da DatoCMS a Supabase PostgreSQL
- **CRUD da frontend**: form per creare/editare eventi e contesti direttamente nell'app
- **Ricerche**: filtri salvati su eventi (per tag, type, range temporale) con vista alternativa
- **Vista verticale**: consultazione cronologica dettagliata
- **Export**: PDF/stampa delle timeline e delle ricerche
- **Collaborazione**: Supabase Realtime per editing multi-utente
- **Trasforma evento in timeline**: l'evento diventa il primo evento di una nuova sub-timeline
- **Move to different root**: spostare una timeline sotto un'altra root