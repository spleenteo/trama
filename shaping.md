---
shaping: true
---

# Timeo — Shaping

---

## Shape A: Next.js + DatoCMS read-only timeline viewer

Viewer/explorer read-only di timeline gerarchiche. I dati vivono su DatoCMS (admin UI). Il frontend Next.js consuma i dati via GraphQL e li visualizza su un asse temporale orizzontale con zoom e pan.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **DatoCMS come backend** | |
| A1.1 | Tree Collection nativa per Context (parent/children gestiti da DatoCMS) | |
| A1.2 | GraphQL CDA con `executeQuery` + Next.js fetch caching per server state | |
| A1.3 | Draft mode via Next.js Draft Mode API + `includeDrafts: true` | |
| **A2** | **Timeline Canvas (zoom + pan)** | |
| A2.1 | Div con `overflow: hidden`, stato: `viewportStart` in anni + `pixelsPerYear` | |
| A2.2 | `yearToPixel(year, viewportStart, pixelsPerYear)` → posizione x | |
| A2.3 | Zoom wheel: `yearUnderCursor = viewportStart + (mouseX / ppy)` → `newStart = yearUnderCursor - (mouseX / newPPY)` | |
| A2.4 | Pan drag: `usePointerDrag` hook unifica mouse e touch — `deltaYears = deltaX / ppy` → `newStart = startVS - deltaYears` | |
| A2.5 | Framer Motion limitato a: fit-to-view (click bottone) e apertura/chiusura aside panel. Zoom e pan sono aggiornamenti di stato diretti (no tweening) | |
| **A3** | **Asse temporale con label adattive** | |
| A3.1 | `getAxisLabels(viewportStart, viewportEnd, widthPx)` → `{year, label, x}[]` | |
| A3.2 | Formattazione adattiva con JS Number standard (no BigInt) — anni in range [-13.8e9, 22e9] dentro i limiti di precisione IEEE 754 | |
| A3.3 | Distanza minima ~100px tra labels per evitare collisioni | |
| A3.4 | Marker "Present" (anno corrente) con stile distinto | |
| **A4** | **Visibility system (zoom-based)** | |
| A4.1 | `getVisibleEvents(events, pixelsPerYear)` → array filtrato | |
| A4.2 | Soglie esportate come costanti configurabili: `ppy < 1` → solo `super`; `1 ≤ ppy < 100` → `super+main`; `ppy ≥ 100` → tutti | |
| **A5** | **Event clustering** | |
| A5.1 | Calcolato post-visibility-filter; ricalcolato solo a cambio di `pixelsPerYear` (non durante pan). Algoritmo: sweep lineare su eventi ordinati per x, aggrega se distanza < 30px | |
| A5.2 | Click cluster → `newPPY = viewportWidth / (clusterRange + 2*padding)`; `newStart = clusterMin - padding` — aggiornamento stato diretto | |
| **A6** | **Context Tree (sidebar sinistra)** | |
| A6.1 | Albero navigabile con nodi espandibili/collassabili | |
| A6.2 | Query GraphQL con 4 livelli hardcoded — vincolo accettato per MVP (vedi R12) | |
| A6.3 | Click su nodo → `router.push('/timeline/[slug]')` — history entry aggiunta per ogni navigazione | |
| **A7** | **SubTimeline Bars** | |
| A7.1 | I contesti figli del contesto attivo mostrati come barre orizzontali sotto la timeline | |
| A7.2 | Range barra = eventi del figlio o `soft_start/end_year`; se nessuno dei due disponibile → barra non mostrata | |
| A7.3 | Click barra → `router.push('/timeline/[slug]')` | |
| **A8** | **Event Detail Panel (aside destro)** | |
| A8.1 | Slide-in da destra con animazione Framer Motion | |
| A8.2 | Mostra tutti i campi dell'evento: testo, immagini, tag, link, custom fields | |
| A8.3 | URL aggiornato con `?event=[slug]` per deep linking | |
| A8.4 | Click su `related_event` cross-contesto → `router.push('/timeline/[altroSlug]?event=[eventSlug]')` — pagina destinazione legge param e inizializza panel aperto | |
| **A9** | **State management** | |
| A9.1 | URL state: slug contesto attivo + `?event=[slug]` per evento selezionato | |
| A9.2 | Zustand store: `selectedEventId`, `sidebarOpen`, `viewportStart`, `pixelsPerYear` | |
| A9.3 | Server state: Next.js fetch cache + revalidate via webhook DatoCMS | |

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | L'utente può esplorare una timeline orizzontale con zoom e pan liberi | Core goal |
| R1 | La scala temporale copre range estremi: da giorni a miliardi di anni (anche negativi) | Core goal |
| R2 | Gli eventi visibili cambiano in base al livello di zoom (visibility system) | Core goal |
| R3 | L'utente può navigare la gerarchia dei contesti da una sidebar ad albero | Core goal |
| R4 | Le sub-timeline figlie sono visibili come barre contestuali sulla timeline del parent | Core goal |
| R5 | Click su un evento apre un panel con tutti i dettagli (testo, immagini, tag, link) | Core goal |
| R6 | I dati sono gestiti interamente da DatoCMS (nessun CRUD da frontend) | Core goal |
| R7 | Deep linking: URL riflette contesto attivo ed evento selezionato | Must-have |
| R8 | Performance accettabile con timeline che hanno molti eventi (clustering) | Must-have |
| R9 | Al caricamento il viewport fa fit-to-view sull'intero range degli eventi del contesto | Must-have |
| R10 | Ogni navigazione tra contesti usa `router.push` — il back button torna al contesto precedente | Must-have |
| R11 | Un contesto senza eventi e senza soft dates mostra una timeline vuota con range di default e messaggio placeholder | Must-have |
| R12 | La sidebar mostra al massimo 4 livelli di profondità — vincolo accettato per MVP | Out |
| R13 | Il sito funziona su mobile (graceful degradation) | Nice-to-have |

