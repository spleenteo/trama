---
shaping: true
---

# V1 — Home Timeline View

**Demo:** Toggle sulla home → le barre dei contesti radice appaiono su una timeline; click su una barra naviga al contesto.

**Affordances:** U1, U4, U5, N1, N2, N3 (base), S1

---

## File da creare

### `components/home/HomeView.tsx` *(nuovo, client component)*

Stato: `viewMode: 'cards' | 'timeline'` (useState, default `'cards'`).

```
Props: { allContexts: ContextCard[]; }
```

Renderizza:
- Toggle button (U1): testo "Card" / "Timeline", o icone grid/timeline
- Se `viewMode === 'cards'`: il grid di `TimelineCard` esistente (estratto da `page.tsx`)
- Se `viewMode === 'timeline'`: `<HomeTimelineView contexts={allContexts} />`

Il toggle è sticky in alto nella sezione contenuto.

---

### `components/home/HomeTimelineView.tsx` *(nuovo, server/client)*

```
Props: { contexts: ContextCard[]; }
```

Funzione `buildUniverseContext(roots: ContextCard[]): ContextTree`:
```typescript
{
  id: 'universe',
  title: 'Timeo',
  slug: 'universe',
  color: null,
  softStartYear: null,
  softEndYear: null,
  isConcluded: false,
  description: null,
  featuredImage: null,
  children: roots.map(r => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    color: r.color,
    softStartYear: r.softStartYear,
    softEndYear: r.softEndYear,
    isConcluded: r.isConcluded,
    description: null,
    featuredImage: null,
    children: [],
  })),
}
```

Renderizza `<TimelineCanvas>` con:
- `context={buildUniverseContext(contexts)}`
- `events={[]}` — nessun evento diretto in V1
- `showContextBar={false}` — la barra "Timeo" non ha senso nella home
- `initialEventSlug={undefined}`

Altezza: `h-[70vh]` o `flex-1` — discussione con l'utente se necessario.

---

## File da modificare

### `app/page.tsx`

- Diventa un server component che passa i dati a `HomeView`
- Rimuove il rendering diretto della grid; lo delega a `HomeView`

```typescript
// Struttura risultante:
export default async function HomePage() {
  const { allContexts } = await performRequest<QueryResult>(ALL_ROOT_CONTEXTS_QUERY);
  return (
    <main ...>
      <header ...>...</header>
      <div ...>
        <HomeView allContexts={allContexts} />
      </div>
    </main>
  );
}
```

---

### `components/timeline/TimelineCanvas.tsx`

Aggiunge prop opzionale:
```typescript
showContextBar?: boolean; // default: true
```

Nel render, condiziona il `<TimelineBar>`:
```typescript
{showContextBar !== false && (
  <TimelineBar ... />
)}
```

Nota: `ContextDetailHeader` per Universe mostrerà "Timeo" senza descrizione — accettabile in V1, da rifinire se necessario.

---

## Nessuna modifica a

- `lib/types.ts` — `ContextTree` già soddisfa la struttura Universe
- `lib/datocms/queries.ts` — `ALL_ROOT_CONTEXTS_QUERY` non cambia in V1 (childEvents in V2)
- `SubTimelineBars.tsx` — funziona già con i children del Universe context
- `TimelineAxis`, `ZoomControls`, `EventMarker` — invariati

---

## Ordine di implementazione

1. Aggiungi prop `showContextBar` a `TimelineCanvas`
2. Crea `HomeTimelineView.tsx` con `buildUniverseContext`
3. Crea `HomeView.tsx` con toggle e rendering condizionale
4. Aggiorna `app/page.tsx` per usare `HomeView`

---

## Smoke test

- Home carica, la grid appare come prima
- Click toggle → `TimelineCanvas` appare con le barre root
- Le barre coprono i range corretti (softStartYear/softEndYear)
- Click su una barra → naviga a `/timeline/[slug]`
- Click toggle di nuovo → ritorna alla grid
- `TimelineBar` "Timeo" non è visibile in home timeline view
