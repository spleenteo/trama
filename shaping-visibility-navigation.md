---
shaping: true
---

# Visibility degli eventi e navigazione gerarchica — Shaping

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | La `visibility` di un evento determina a quale livello di navigazione è visibile | Core goal |
| R1 | Un evento `super` è visibile a tutti i livelli di navigazione come marker pieno | Must-have |
| R2 | Un evento `main` è visibile come dot+hover al livello del padre diretto (quando si vedono i fratelli come barre); come marker pieno nel proprio contesto diretto | Must-have |
| R3 | Un evento `regular` è visibile solo nel proprio contesto diretto come marker pieno | Must-have |
| R4 | La home ha un toggle tra vista card e vista timeline | Must-have |
| R5 | La home timeline mostra i contesti radice come barre | Must-have |
| R6 | Ogni livello mostra gli eventi `super` e `main` solo dei figli immediati (non dei discendenti profondi) | Must-have |
| R7 | La navigazione in un contesto applica le stesse regole ricorsivamente a ogni livello | Must-have |
| R8 | In futuro, eventi `super` di contesti adiacenti sulla home creano correlazioni cross-contesto (es. Garibaldi + Musica che si sovrappongono nel tempo) | Out (ora) |

---

## Modello semantico di visibilità

```
Livello home (Universe virtuale)
├── Contesto radice A [barra]          ← super di A visibili come marker pieni
│   ├── Sub-contesto A1 [barra]        ← super+main di A1 visibili quando si naviga A
│   └── Sub-contesto A2 [barra]        ← super+main di A2 visibili quando si naviga A
│       └── Sub-contesto A2.1 [barra]  ← super+main di A2.1 visibili quando si naviga A2
└── Contesto radice B [barra]          ← super di B visibili come marker pieni
```

**Regola:** ogni livello vede gli eventi dei propri **figli immediati**, filtrati per visibility:
- `super` → marker pieno
- `main` → dot + hover tooltip
- `regular` → nascosto

Quando entri in un contesto, diventi il "padre" e i tuoi figli diventano il livello visibile.

---

## A: Visibility per livello + home timeline con toggle

### A1: Filtro visibilità contestuale

| Part | Mechanism |
|------|-----------|
| A1.1 | `TimelineCanvas` riceve `childEvents: EventSummary[]` — eventi dei figli già filtrati per visibility |
| A1.2 | `childEvents` con `visibility: super` → renderizzati come `EventMarker` normale |
| A1.3 | `childEvents` con `visibility: main` → renderizzati come `DotMarker` (nuovo componente, r=4, colore del contesto sorgente, nessuno stem) |
| A1.4 | `EventMarker` esistente rimane invariato — gestisce solo gli eventi `own` del contesto corrente |

### A2: DotMarker — marker compatto per eventi main

| Part | Mechanism |
|------|-----------|
| A2.1 | Nuovo componente SVG: cerchio r=4, fill dal colore del contesto sorgente, stroke white |
| A2.2 | Al hover: tooltip con titolo evento, anno, nome contesto sorgente |
| A2.3 | Click: naviga all'evento (come `EventMarker`) |
| A2.4 | Posizionato sull'asse (stesso Y dei marker pieni), senza stem |

### A3: Fetch degli eventi dei figli immediati

Il modello Context ha già `inverse_relationships_enabled: true` → `_allReferencingEvents` è disponibile in GraphQL CDA senza modifiche allo schema.

| Part | Mechanism |
|------|-----------|
| A3.1 | `CONTEXT_BY_SLUG_QUERY` aggiornata: ogni `children` include `_allReferencingEvents(filter: { visibility: { in: ["super", "main"] } })` con i campi necessari |
| A3.2 | `ALL_ROOT_CONTEXTS_QUERY` aggiornata: ogni radice include `_allReferencingEvents(filter: { visibility: { eq: "super" } })` (solo super in home) |
| A3.3 | Un'unica query recupera contesto + figli + loro eventi filtrati — nessuna query aggiuntiva a runtime |
| A3.4 | Ogni evento risultante porta `sourceContextId` e `sourceContextColor` (dal contesto figlio) per colorare il dot |

### A4: Home timeline view

| Part | Mechanism |
|------|-----------|
| A4.1 | Toggle card/timeline nella home: stato locale React (`useState`), URL param opzionale (`?view=timeline`) |
| A4.2 | Vista timeline: `TimelineCanvas` con contesto virtuale "Universe" — `children = allRootContexts`, `events = []` inizialmente |
| A4.3 | Per ogni contesto radice, fetch degli eventi `super` diretti (stessa logica A3-A o A3-B) |
| A4.4 | `computeTimelineRange` applicata sull'insieme di tutti i contesti radice per il fit iniziale |
| A4.5 | Click su barra radice → `router.push('/timeline/[slug]')` (comportamento identico a `SubTimelineBars`) |

### A5: Query GraphQL aggiornata

| Part | Mechanism |
|------|-----------|
| A5.1 | `CONTEXT_BY_SLUG_QUERY`: aggiunge fetch degli eventi `super+main` dei figli (via A3-A o A3-B) |
| A5.2 | `ALL_ROOT_CONTEXTS_QUERY`: aggiunge fetch degli eventi `super` dei radici per la home timeline |
| A5.3 | `EventSummary` type: aggiunge campo opzionale `sourceContextId?: string` e `sourceContextColor?: string` per i dot |

---

## Fit Check: R × A

| Req | Requirement | Status | A |
|-----|-------------|--------|---|
| R0 | La `visibility` determina a quale livello è visibile | Core goal | ✅ |
| R1 | `super` visibile a tutti i livelli come marker pieno | Must-have | ✅ |
| R2 | `main` come dot+hover al padre, pieno nel proprio contesto | Must-have | ✅ |
| R3 | `regular` solo nel contesto diretto | Must-have | ✅ |
| R4 | Home: toggle card/timeline | Must-have | ✅ |
| R5 | Home timeline mostra contesti radice come barre | Must-have | ✅ |
| R6 | Solo figli immediati (non discendenti profondi) | Must-have | ✅ |
| R7 | Regole applicate ricorsivamente a ogni livello | Must-have | ✅ |

**Note:**
- A3 ha due sub-alternative (A3-A e A3-B) — entrambe passano il fit check, la scelta è operativa

---

## Decisioni chiuse

- **A3**: relazioni inverse già abilitate su Context (`inverse_relationships_enabled: true`) → si usa `_allReferencingEvents` inline. Zero modifiche allo schema.
- **A4.2**: home timeline come contesto virtuale "Universe" — `TimelineCanvas` riceve struttura identica a una pagina contesto normale.
