# Bonifica post-audit di Trama — design

Data: 2026-09-04. Stato: approvato in chat, in attesa di revisione del documento.

## Contesto

Trama (Next.js 16, React 19, TypeScript, Tailwind 4, Zustand, DatoCMS) è stato
scritto in vibe coding tra il 1 marzo e il 10 aprile 2026 e poi lasciato fermo.
L'audit del 4 settembre 2026 ha trovato:

- un token CMA full-access hardcoded nella skill `trama-seed`, pushato su un
  repo GitHub pubblico (ora revocato tramite rigenerazione; un secondo token
  nella storia era già morto);
- route API di scrittura (`POST /api/nodes`, `PATCH /api/nodes/[id]`) senza
  autenticazione né validazione;
- dipendenze arretrate, `next` 16.1.6 con una lunga lista di advisory;
- nessun test, 11 errori eslint, tre bug reali nel canvas, la logica
  "intervallo di un nodo" copiata in cinque punti con semantiche diverse,
  tipi GraphQL scritti a mano che non rispecchiano le query;
- documentazione e nomenclatura non allineate al modello unificato `Node`.

Il progetto non è deployato e l'editing dalla UI serve solo in locale.

## Decisioni prese

| Tema | Decisione |
| - | - |
| Editing | Solo in locale. In produzione non esiste superficie di scrittura. |
| Cache CDA | Rimandata al deploy. Non si aggiungono cache tag, webhook né `force-static`. |
| Storia git | Riscritta con `git-filter-repo` per rimuovere i due token, force push su `main` e `chore/new-shaping`. |
| DatoCMS | Ogni operazione passa dalla CLI ufficiale con le skill `datocms:*`. Mai MCP. |
| Intervallo | Fine inclusiva del periodo indicato; `toPresent` è la data frazionaria di oggi. |
| Tipi | gql.tada; albero costruito in codice da una query piatta paginata. |

## Sotto-progetto 1 — Bonifica segreti e igiene del repo

Si fa direttamente su `main`, prima di tutto il resto.

1. `datocms` in `devDependencies`; `datocms.config.json` (creato dal link,
   contiene solo `siteId` e `organizationId`) committato.
2. `.claude/skills/trama-seed/skill.md` riga 271: il comando legge
   `$DATOCMS_API_TOKEN`; la skill ribadisce di non hardcodare mai il token.
3. `.claude/settings.local.json` fuori dal tracking e in `.gitignore`.
4. Cartella `memory/` eliminata dal repo (parla di Timeo e di modelli inesistenti).
5. `.env.local.example` aggiornato: `DATOCMS_API_TOKEN` (CMA, script e editing
   locale), `NEXT_PUBLIC_DATOCMS_API_TOKEN` (CDA read-only), `TRAMA_EDITING`.
   `DATOCMS_DRAFT_MODE` rimosso perché mai letto.
6. Riscrittura della storia: `brew install git-filter-repo`, clone di backup
   nella scratchpad, `git filter-repo --replace-text` con i due token sostituiti
   da `***REMOVED***`, ripristino del remote, `git push --force` di `main` e
   `chore/new-shaping`. Nota: GitHub può tenere i commit orfani raggiungibili
   per hash; la revoca resta la misura vera.

Verifica: `git grep` e `git log -p --all` non trovano più stringhe esadecimali
di 30 caratteri; `npx datocms whoami` e `cma:call site find` funzionano.

## Sotto-progetto 2 — Editing solo in locale, validazione, upgrade

Branch `chore/editing-guard-and-upgrade`.

### Flag di editing

- Variabile server `TRAMA_EDITING=true`, assente di default.
- `lib/editing.ts`: `isEditingEnabled()` legge la variabile.
- Le route POST e PATCH rispondono 404 quando il flag è spento, prima di
  qualsiasi altra logica.
- Le pagine server leggono il flag e lo passano come prop `editingEnabled` a
  `TimelinePageShell`, che lo inoltra a `DragProvider` (prop `enabled`) e alla
  modal di creazione. Con `enabled` falso, `startDrag` è un no-op e i controlli
  di creazione non vengono montati.

### Validazione

- `lib/api/node-schemas.ts` con zod: `createNodeSchema` (titolo 1–200, anno
  intero finito, mese 1–12, giorno 1–31, `endYear` intero opzionale,
  `visibility` enum `regular|main|super`, `parent` id DatoCMS) e
  `moveNodeSchema` (`parent_id` id DatoCMS).
- Le route fanno `request.json()` dentro il try e rispondono 422 con gli errori
  di zod. Il PATCH rifiuta `parent_id === id` e verifica con `items.find` che il
  target appartenga al modello Node.
- `lib/api/nodes-client.ts` con `createNode()` e `moveNode()`: sostituiscono le
  tre fetch duplicate in `CreateEventModal`, `TimelineCanvas`, `DropBreadcrumb`,
  incluso il ritardo di propagazione e `router.refresh()`.

### Upgrade e hardening

- `next` ed `eslint-config-next` a 16.3.4; `npm update` per il resto;
  `@datocms/cma-client-node` resta sulla 5.x.
- `@mux/mux-player-react` rimosso.
- `next.config.ts`: header `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Permissions-Policy`.
- `tsconfig.json` include `scripts/` nel type-check.

Verifica: `npm audit` senza high; `tsc`, `eslint`, `next build` puliti; con
`TRAMA_EDITING` assente le route rispondono 404 e la UI non mostra controlli.

## Sotto-progetto 3 — Test, intervallo unico, bug del canvas

Branch `fix/timeline-core`.

### Test

- Vitest, script `npm test`. Test scritti prima del refactor su `scale.ts`,
  `date-utils.ts`, `tree-utils.ts`, `collision.ts`, `clusterEvents`.

### Intervallo unico

- `lib/timeline/interval.ts`: `getInterval(node): { start, end }` in anni
  frazionari. Semantica: `start` è l'inizio del periodo indicato da
  `year/month/day`; `end` è la fine inclusiva del periodo indicato da
  `endYear/endMonth/endDay` (un nodo 1963–2004 finisce a 2005.0; fine "giugno
  1815" finisce a 1815-07-01). Senza `endYear`, `end = start`. `toPresent` usa
  la data frazionaria corrente. Garantito `end >= start`.
- `endMonth` ed `endDay` in `NodeBase` e in tutte le query.
- Sostituisce `nodeEnd`/`computeRange` in `tree-utils`, `deriveRange` in
  `HomeTimelineView`, i cinque rami di centratura in `TimelineCanvas`, i calcoli
  in `SubTimelineBars` e `GhostBars`. Un solo `THIS_YEAR`/`now()` in
  `date-utils`.

### Canvas

- `pointercancel` registrato e rimosso con la stessa reference.
- Drop gestito solo nel `DragProvider`: i target si registrano, `endDrag`
  restituisce il payload dall'updater di `setState`; nessuna ref scritta nel
  render; un solo `moveNode()` per drop.
- Hook prima degli early return: `SuperEventMarker` e `TimelineBar` divisi in
  wrapper di visibilità e componente interno.
- `animate()` con handle salvato, `stop()` in cleanup e prima di una nuova
  animazione.
- Effetto di centratura con `useEffectEvent`; rimozione dell'`eslint-disable`.
- Calcoli indipendenti dal viewport (`computeTimelineRange`, `leafIds`,
  anno frazionario per evento) memoizzati; `GhostBars` riceve `siblingRanges`
  dal server.
- Prop `children` di `SubTimelineBars` rinominata `nodes`.
- Store: `selectNode(id)` e `toggleNode(id)` al posto di `setSelectedEvent`.
- `app/error.tsx`, `app/not-found.tsx`; `EventDetailPanel` con `catch` e stato
  di errore.

Verifica: test verdi, eslint a zero errori, drag & drop e centratura provati
in locale con `TRAMA_EDITING=true`.

## Sotto-progetto 4 — Tipi generati, dati, nomenclatura, docs

Branch `refactor/data-layer-and-naming`.

### Tipi e dati

- gql.tada: script `generate-schema` (token CDA da `.env.local`), plugin in
  `tsconfig.json`, `lib/datocms/graphql.ts` con gli scalari DatoCMS,
  `schema.graphql` e `graphql-env.d.ts` committati.
- Query riscritte con `graphql()` e frammenti; tipi dei risultati con
  `ResultOf`. I tipi di dominio (`NodeWithRange`, `ChildEvent`, tipi con range)
  restano in `lib/types.ts`.
- Una query piatta `allNodes` paginata con `executeQueryWithAutoPagination`
  (campi summary + `parent { id }`) e `buildTree(nodes)` in
  `lib/timeline/tree-utils.ts`. Sostituisce `NODE_TREE_QUERY`,
  `CHILD_NODES_QUERY` e `PROMOTED_EVENTS_QUERY`; rimuove il limite di 4 livelli.
  `NODE_DETAIL_QUERY` resta per il pannello di dettaglio.
- Il parametro `?event=` (rinominato `?node=`) esce dalla pagina server: letto e
  scritto lato client con `useSearchParams` e `history.replaceState`.
- Wrapper `performRequest` con `excludeInvalid: true` e gestione di `ApiError`.

### Nomenclatura e pulizia

- `selectedEventId` → `selectedNodeId`; prop `context` → `node`;
  `ContextDetailHeader` → `NodeDetailHeader`; `EventDetailPanel` →
  `NodeDetailPanel`; `computedMin/Max` e `computedStart/End` → `start/end`.
- Export morti rimossi: `inheritColor`, `isContainer` (o usato al posto delle
  copie inline), `getZoomLevelForRange`, `sortEventsByDate`,
  `VISIBILITY_THRESHOLDS`, `NODE_BY_SLUG_MINIMAL_QUERY`, `sourceContextId`,
  ramo `<svg>` di `TimelineAxis`.
- `lang="it"`, font Geist ripristinato in `globals.css`, residui del template
  rimossi, `<a>` → `<Link>` in `DropBreadcrumb`.

### Documentazione

- `README.md` riscritto: cosa è Trama, setup (`datocms login`, `link`,
  `.env.local`), editing locale, seed, test. Sezione "al deploy" con i passi
  per cache tag e webhook.
- `docs/project-structure.md` rigenerato dal codice reale.
- Changelog e versione aggiornati con la skill di documentazione del progetto.

Verifica: `tsc`, `eslint`, `vitest`, `next build` puliti; home e timeline
provate in locale.

## Metodo di lavoro

- Sotto-progetto 1 su `main`. Gli altri su branch in worktree separato, con
  piano di implementazione scritto (`writing-plans`), esecuzione con TDD,
  code review prima del merge, merge su `main` a fine sotto-progetto.
- Le operazioni su DatoCMS (lettura schema, token, seed) passano da
  `npx datocms ...` con le skill; nessun MCP.

## Fuori scopo

- Cache tag, route di revalidazione, `force-static`: al deploy.
- Autenticazione utenti: non serve finché l'editing è solo locale.
- `@datocms/cma-client-node` 6.x e `framer-motion` 13: non necessari.
- Pre-commit hook di secret scanning: consigliato, non incluso.
