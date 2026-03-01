---
shaping: true
---

# V2 — Super child events visibili

**Demo:** Home timeline → eventi `super` dai contesti radice appaiono come marker. Pagina contesto con sub-contesti → eventi `super` dei figli appaiono come marker pieni, colorati con il colore del contesto sorgente.

**Affordances:** N3 (aggiornata), N4, N5, N8 (super), U6, U9 (super child)

---

## Prerequisiti

V1 completata.

---

## Tipo nuovo: `ChildEvent`

### `lib/types.ts` — aggiunge

```typescript
export interface ChildEvent extends EventSummary {
  sourceContextId: string;
  sourceContextColor: string | null; // hex
}
```

---

## Query aggiornate

### `lib/datocms/queries.ts`

**`CONTEXT_BY_SLUG_QUERY`** — aggiunge `_allReferencingEvents` ai `children`:

```graphql
children {
  id
  title
  slug
  color { hex }
  softStartYear
  softEndYear
  isConcluded
  _allReferencingEventsMeta(filter: { visibility: { in: ["super", "main"] } }) {
    count
  }
  _allReferencingEvents(
    filter: { visibility: { in: ["super", "main"] } }
    orderBy: year_ASC
    first: 200
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
    featuredImage {
      responsiveImage(imgixParams: { w: 200, h: 200, fit: crop }) {
        ...imageFields
      }
    }
    tags { id name slug color { hex } }
    relatedEvents { id title slug year context { id title } }
  }
}
```

**`ALL_ROOT_CONTEXTS_QUERY`** — aggiunge `_allReferencingEvents` solo `super` a ogni radice:

```graphql
# All'interno di allContexts { ... }
_allReferencingEvents(
  filter: { visibility: { eq: "super" } }
  orderBy: year_ASC
  first: 100
) {
  id title slug year month day time
  endYear endMonth endDay
  visibility eventType
  featuredImage { responsiveImage(imgixParams: { w: 200, h: 200, fit: crop }) { ...imageFields } }
  tags { id name slug color { hex } }
  relatedEvents { id title slug year context { id title } }
}
```

---

## Helper: `extractChildEvents`

### `lib/timeline/child-events.ts` *(nuovo)*

```typescript
import type { ChildEvent } from '@/lib/types';

interface ContextWithRefEvents {
  id: string;
  color?: { hex: string } | null;
  _allReferencingEvents?: Omit<ChildEvent, 'sourceContextId' | 'sourceContextColor'>[];
}

export function extractChildEvents(children: ContextWithRefEvents[]): ChildEvent[] {
  return children.flatMap((ctx) =>
    (ctx._allReferencingEvents ?? []).map((ev) => ({
      ...ev,
      sourceContextId: ctx.id,
      sourceContextColor: ctx.color?.hex ?? null,
    }))
  );
}
```

---

## Pagine aggiornate

### `app/timeline/[slug]/page.tsx`

- Importa `extractChildEvents`
- Dopo aver ricevuto `context` dalla query, estrae i child events:

```typescript
const childEvents = extractChildEvents(context.children);
```

- Passa a `TimelineCanvas`:
```typescript
<TimelineCanvas
  context={context}
  events={allEvents}
  childEvents={childEvents}
  initialEventSlug={eventSlug}
/>
```

### `components/home/HomeTimelineView.tsx`

- `contexts` ora tipizzato come `ContextCard[]` con `_allReferencingEvents` opzionale
- Estrae `childEvents = extractChildEvents(contexts)` (solo super, per come è configurata la query)
- Passa a `TimelineCanvas`:
```typescript
<TimelineCanvas
  context={buildUniverseContext(contexts)}
  events={[]}
  childEvents={childEvents}
  showContextBar={false}
/>
```

---

## `TimelineCanvas` — nuova prop + render pipeline

### Props

```typescript
childEvents?: ChildEvent[];
```

### Render pipeline

Dopo `const { singles, clusters } = clusterEvents(...)`:

```typescript
// Smista child events per visibility
const superChildEvents = (childEvents ?? []).filter(e => e.visibility === 'super');
// main in V3
```

Nel JSX, dopo i marker degli eventi propri:

```typescript
{superChildEvents.map((ev) => (
  <EventMarker
    key={`child-${ev.id}`}
    event={ev}
    color={ev.sourceContextColor ?? undefined}
    viewportStart={viewportStart}
    pixelsPerYear={pixelsPerYear}
    canvasHeight={canvasHeight}
    axisY={axisY}
    onSelect={setSelectedEvent}
  />
))}
```

Nota: i child super events non passano per `getVisibleEvents` (sono già filtrati per visibility al fetch).
Non passano nemmeno per il clustering in V2 — sono sempre visibili come singles.

---

## `EventMarker` — colore contestuale

Aggiunge prop opzionale:
```typescript
color?: string;
```

Sostituisce la riga:
```typescript
const color = '#6b7280'; // default
```

Con:
```typescript
const color = colorProp ?? context?.color?.hex ?? '#6b7280';
```

Dove `colorProp` è il nome della prop locale (non shadowing `color` in scope).

Più semplice: rinomina la costante:
```typescript
const markerColor = color ?? '#6b7280';
```

E usa `markerColor` dove ora usa `color`.

---

## Aggiornamento tipi query

`CONTEXT_BY_SLUG_QUERY` restituisce ora `children` con `_allReferencingEvents`. Aggiorna il tipo in `app/timeline/[slug]/page.tsx`:

```typescript
interface ContextResult {
  context: (ContextTree & {
    parent?: { id: string; slug: string } | null;
    children: Array<ContextTree['children'][number] & {
      _allReferencingEvents: EventSummary[];
    }>;
  }) | null;
}
```

Oppure considera di aggiungere `_allReferencingEvents?: EventSummary[]` a `ContextBase` direttamente (più semplice e riusabile).

---

## Ordine di implementazione

1. Aggiorna query `CONTEXT_BY_SLUG_QUERY` e `ALL_ROOT_CONTEXTS_QUERY`
2. Aggiungi `ChildEvent` a `lib/types.ts`
3. Crea `lib/timeline/child-events.ts`
4. Aggiorna `EventMarker` con prop `color?`
5. Aggiorna `TimelineCanvas` con prop `childEvents?` + render super
6. Aggiorna `timeline/[slug]/page.tsx` con `extractChildEvents`
7. Aggiorna `HomeTimelineView` con child events

---

## Smoke test

- Pagina contesto Garibaldi → eventi `super` dei sub-contesti appaiono come marker, colorati con il colore del sub-contesto sorgente
- Home timeline → eventi `super` dei contesti radice appaiono come marker
- Gli eventi `main` e `regular` dei figli NON appaiono in questa slice (V3)
- Gli eventi propri del contesto non cambiano comportamento
