---
shaping: true
---

# V3 — DotMarker per eventi main

**Demo:** Navigando un contesto con sub-contesti, gli eventi `main` dei figli appaiono come piccoli dot colorati sull'asse. Hover → tooltip con titolo, anno, nome contesto sorgente. Click → apre il dettaglio evento.

**Affordances:** N8 (main), U10, U10b — nuovo componente `DotMarker`

---

## Prerequisiti

V2 completata.

---

## Nuovo componente: `DotMarker`

### `components/timeline/DotMarker.tsx` *(nuovo)*

```typescript
'use client';

import type { ChildEvent } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { eventToFractionalYear, formatTimelineDate } from '@/lib/timeline/date-utils';

interface Props {
  event: ChildEvent;
  viewportStart: number;
  pixelsPerYear: number;
  axisY: number;
  onSelect: (id: string) => void;
}

const R = 4; // raggio dot
```

**Posizionamento:** sull'asse (`cy = axisY`), nessuno stem.

**Rendering:**
- `<title>` per tooltip nativo: `"${event.title} — ${formatTimelineDate(...)} · ${sourceContextName}"`
  - Nota: il tooltip nativo non è interattivo; sufficiente per V3. Un tooltip custom può venire dopo.
- Cerchio pieno `r={R}`, fill = `sourceContextColor ?? '#9ca3af'`, stroke = white, strokeWidth = 1.5
- Hit area: cerchio trasparente `r={R + 8}` per facilitare il click
- Click → `onSelect(event.id)`

**Out-of-viewport culling:** se `x < -20 || x > width + 20` → return null (accetta prop `width`).

```typescript
interface Props {
  event: ChildEvent;
  viewportStart: number;
  pixelsPerYear: number;
  axisY: number;
  width: number;
  onSelect: (id: string) => void;
}
```

---

## `TimelineCanvas` — routing main events

Estende il routing dei child events in V2:

```typescript
const superChildEvents = (childEvents ?? []).filter(e => e.visibility === 'super');
const mainChildEvents  = (childEvents ?? []).filter(e => e.visibility === 'main');
```

Nel JSX, dopo i super child events:

```typescript
{mainChildEvents.map((ev) => (
  <DotMarker
    key={`dot-${ev.id}`}
    event={ev}
    viewportStart={viewportStart}
    pixelsPerYear={pixelsPerYear}
    axisY={axisY}
    width={width}
    onSelect={setSelectedEvent}
  />
))}
```

Import da aggiungere:
```typescript
import DotMarker from '@/components/timeline/DotMarker';
```

---

## Nota su clustering dei dot

In V3 i dot NON vengono clusterizzati — sono già piccoli e se si sovrappongono si vedono come stack visivo (accettabile). Il clustering dei dot può essere aggiunto in una slice futura se la densità diventa un problema.

---

## Nota su home timeline

Sulla home timeline vengono portati solo eventi `super` (query `ALL_ROOT_CONTEXTS_QUERY` filtra solo `super`). I dot `main` non appaiono sulla home — coerente con il modello semantico (main è visibile al livello padre, non al livello nonno/Universe).

---

## Tooltip avanzato (futura ottimizzazione)

Il `<title>` SVG nativo è sufficiente per V3. Se si vuole un tooltip custom:
- `useState<ChildEvent | null>(null)` per tracked hover
- `onMouseEnter` / `onMouseLeave` su DotMarker
- Floating div assoluto posizionato dinamicamente

Non implementare in V3 — mantieni semplice.

---

## Ordine di implementazione

1. Crea `DotMarker.tsx`
2. Aggiorna `TimelineCanvas`: aggiungi `mainChildEvents` + render `DotMarker`

---

## Smoke test

- Pagina contesto Garibaldi (che ha sub-contesti) → eventi `main` dei figli appaiono come dot colorati sull'asse
- Hover su dot → tooltip con titolo, anno, nome contesto
- Click su dot → apre `EventDetailPanel` con il dettaglio evento
- Gli eventi `super` continuano ad apparire come marker pieni (V2 invariato)
- Gli eventi `regular` dei figli NON appaiono (solo nel loro contesto diretto)
- Home timeline non mostra dot (solo super) — comportamento corretto
