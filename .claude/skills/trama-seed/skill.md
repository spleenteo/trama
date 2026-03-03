---
name: trama-seed
description: Skill per caricare nuove timeline su DatoCMS per il progetto Trama. Guida l'utente dalla definizione del tema fino alla pubblicazione di nodi e immagini nell'alberatura nodi.
---

# Trama Seed — Carica una nuova timeline

Quando questa skill viene invocata, segui le **5 fasi** descritte di seguito in ordine. Non saltare fasi e non generare codice prima di aver mostrato il piano all'utente e ricevuto conferma.

---

## Costanti di progetto

```
Node model ID    : JbziKHLoTUCdJCdTZwWWlg
API token env    : DATOCMS_API_TOKEN (leggere da .env.local, non hardcodare)
Script dir       : scripts/
Runner           : npx tsx
```

**Enum DatoCMS:**
- `visibility`: `regular` | `main` | `super`
- `event_type`: `event` | `incident` | `key_moment`

---

## FASE 1 — Comprensione (dialogo con l'utente)

Poni queste domande **nell'ordine indicato**. Inizia **sempre** dalla domanda 0:

0. **Posizione nella gerarchia** — Il seed deve essere inserito alla **root** (nodo di primo livello, visibile in homepage) oppure **dentro un nodo esistente**?
   - Se dentro un nodo esistente: chiedi l'**ID DatoCMS** del nodo genitore (es. `abc123XYZ`). Salvalo come `PARENT_RECORD_ID`.
   - Se alla root: `PARENT_RECORD_ID = null` (il nodo radice del seed non avrà `parent_id`).

1. **Tema** — Qual è il tema della timeline? _(es. storia del cinema, rivoluzioni scientifiche, architettura moderna)_
2. **Range temporale** — C'è un periodo specifico che ti interessa? _(es. solo il XX secolo, dal Rinascimento al Barocco, dal 1945 ad oggi)_
3. **Focus e sotto-temi** — Quali sono i sotto-temi o categorie principali? Evitare di coprire "tutto": scegliere 4–6 aree specifiche. _(es. per "musica": Blues, Jazz, Rock, Soul — non "tutta la musica popolare")_
4. **Granularità** — Quanti nodi di primo livello vuoi creare? Quanti nodi foglia (eventi) per ognuno? _(default consigliato: 4–6 nodi principali, 4–5 eventi ciascuno)_
5. **Taglio** — C'è un taglio geografico, culturale o per protagonisti? _(es. "solo Europa", "prevalentemente donne", "solo italiani")_

Prima di passare alla Fase 2, riepiloga il brief (inclusa la posizione nella gerarchia) e chiedi conferma.

---

## FASE 2 — Ricerca

Esegui le ricerche **in parallelo dove possibile**. Usa sempre WebSearch e Wikipedia API, non affidarti solo alla knowledge interna.

### 2a. Tema principale
```
WebSearch: "[tema] history overview [range temporale] key periods"
WebSearch: "[tema] [range temporale] Wikipedia"
```

### 2b. Sotto-temi (uno per uno)
```
WebSearch: "[sotto-tema] history origin key dates artists events"
```

### 2c. Nodi foglia (eventi) per ogni sotto-tema
```
WebSearch: "[sotto-tema] most important events figures [range] timeline dates"
```

### 2d. Immagini da Wikimedia Commons
Per ogni soggetto (artista, personaggio, opera, luogo) usa **curl + Wikipedia API** — non WebFetch che riceve 403:

```bash
curl -s "https://en.wikipedia.org/w/api.php?action=query&titles=ARTICLE_1|ARTICLE_2|ARTICLE_3&prop=pageimages&piprop=original&format=json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for p in data['query']['pages'].values():
    print(p.get('title'), ':', p.get('original', {}).get('source', 'NO_IMAGE'))
"
```

Sostituire `ARTICLE_1|ARTICLE_2|ARTICLE_3` con i titoli Wikipedia dei soggetti (max 10 per chiamata, separati da `|`).

> ⚠️ Se un'immagine non si trova, non bloccare — il nodo verrà creato senza immagine.

---

## FASE 3 — Piano strutturato (mostrare e attendere conferma)

**Prima di scrivere una sola riga di codice**, mostra all'utente il piano completo in formato tabellare e attendi conferma esplicita.

### Struttura sempre richiesta: 1 nodo radice + N nodi figli

Ogni seed deve creare **sempre**:
1. **Un nodo radice** — rappresenta il tema principale (es. "Giuseppe Garibaldi", "Storia della Musica").
   - Se `PARENT_RECORD_ID` è valorizzato, questo nodo avrà `parent_id: PARENT_RECORD_ID`.
   - Se `PARENT_RECORD_ID` è null, non avrà `parent_id` (nodo di primo livello in homepage).
2. **N nodi figli (sotto-temi)** — i periodi/generi/categorie, collegati al nodo radice tramite `parent_id: rootId`.
3. **Nodi foglia (eventi)** — collegati al rispettivo nodo figlio tramite `parent_id`.

### Formato tabella piano

```markdown
## Piano: [Tema] ([range])

**Posizione:** [root / figlio di ID=PARENT_RECORD_ID]

### Nodo radice
| Titolo | Slug | Anni | Colore | Immagine |
|--------|------|------|--------|----------|
| Storia della Musica | storia-della-musica | 1900–oggi | #D97706 | ✓ |

### Nodi figli ([N] totali) — figli del nodo radice
| # | Titolo | Slug | Anni | Colore | Immagine |
|---|--------|------|------|--------|----------|
| 1 | Blues  | blues | 1900– | #1565C0 | ✓ Bessie Smith |
| 2 | Jazz   | jazz  | 1895– | #D97706 | ✓ Louis Armstrong |
| 3 | ...    | ...   | ...  | ...    | ... |

#### Blues — [N] eventi
| Anno | Titolo | Tipo | Visibility | Immagine |
|------|--------|------|------------|----------|
| 1920 | Mamie Smith — Crazy Blues | key_moment | super | ✗ nessuna |
| 1923 | Bessie Smith — Downhearted Blues | key_moment | super | ✓ |
```

Attendi `sì`, `ok`, `procedi` o una modifica esplicita prima di passare alla Fase 4.

---

## FASE 4 — Generazione script

Genera lo script `scripts/seed-[tema-slug].ts` seguendo **esattamente** questo template:

```typescript
import { buildClient } from "@datocms/cma-client-node";

// Legge il token da .env.local passato via shell — non hardcodare
const client = buildClient({ apiToken: process.env.DATOCMS_API_TOKEN ?? "" });

const NODE_MODEL = "JbziKHLoTUCdJCdTZwWWlg";

function hex(h: string) {
  return { red: parseInt(h.slice(1,3),16), green: parseInt(h.slice(3,5),16), blue: parseInt(h.slice(5,7),16), alpha: 255 };
}

function dast(...paragraphs: string[]) {
  return {
    schema: "dast",
    document: {
      type: "root",
      children: paragraphs.map(p => ({
        type: "paragraph",
        children: [{ type: "span", value: p }],
      })),
    },
  };
}

async function upload(url: string, title: string) {
  try {
    const u = await client.uploads.createFromUrl({
      url,
      filename: url.split("/").pop()!.split("?")[0],
      skipCreationIfAlreadyExists: true,
      default_field_metadata: {
        en: { title, alt: title, custom_data: {}, focal_point: null },
      },
    });
    console.log(`  ✓ upload: ${title}`);
    return u.id;
  } catch (e: unknown) {
    console.warn(`  ✗ upload fallita "${title}": ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function createNode(fields: Record<string, unknown>) {
  const item = await client.items.create({ item_type: { type: "item_type", id: NODE_MODEL }, ...fields });
  await client.items.publish(item.id);
  console.log(`  ✓ nodo: ${fields.title} (${fields.year ?? ""})`);
  return item.id;
}

function img(id: string | null) {
  return id ? { upload_id: id } : null;
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // ── NODO RADICE ───────────────────────────────────────────────────────────
  // Se il seed va dentro un nodo esistente, aggiungere: parent_id: "ID_RECORD_GENITORE"
  // Se il seed va alla root, omettere parent_id completamente.
  console.log("\n[emoji] [TEMA PRINCIPALE]");
  const imgMain = await upload("URL_WIKIMEDIA", "Nome soggetto principale");

  const rootId = await createNode({
    title: "Titolo Tema Principale",
    slug: "slug-tema",
    // parent_id: "ID_RECORD_GENITORE",   // ← decommentare se seed annidato
    color: hex("#XXXXXX"),
    year: ANNO_INIZIO,
    end_year: ANNO_FINE,             // omettere se ancora aperto / non applicabile
    visibility: "super",
    event_type: "event",
    featured_image: img(imgMain),
    description: dast(
      "Descrizione generale del tema in italiano.",
      "Secondo paragrafo con contesto storico/culturale."
    ),
  });

  // ── [SOTTO-TEMA 1] ────────────────────────────────────────────────────────
  console.log("\n[emoji] [SOTTO-TEMA 1]");
  const imgSubject1 = await upload("URL_WIKIMEDIA", "Nome soggetto");

  const child1Id = await createNode({
    title: "Titolo Sotto-tema",
    slug: "slug-sotto-tema",
    parent_id: rootId,              // ← figlio del nodo radice
    color: hex("#XXXXXX"),
    year: ANNO,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgSubject1),
    description: dast(
      "Paragrafo 1 della descrizione in italiano.",
      "Paragrafo 2 della descrizione in italiano."
    ),
  });

  await createNode({
    title: "Titolo Evento",
    slug: "slug-evento",
    parent_id: child1Id,            // ← figlio del sotto-tema
    year: ANNO,
    // month: MESE,                 // omettere se non noto
    // day: GIORNO,                 // omettere se non noto
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgSubject1),
    description: dast("Descrizione dettagliata dell'evento in italiano."),
  });

  // ... altri sotto-temi ed eventi

  console.log("\n✅ Seed completato! 1 nodo radice, [N] sotto-temi, [N] eventi.");
}

main().catch(e => {
  console.error("Errore:", e);
  process.exit(1);
});
```

### Regole di codice obbligatorie

- **Double-quote** per tutte le stringhe — le apostrofi italiane (`dell'`, `l'`) rompono i single-quote
- **Slug** sempre lowercase, kebab-case, ASCII puro — no accenti, no spazi
- **`skipCreationIfAlreadyExists: true`** su ogni `upload()`
- **`month`**, **`day`**, **`end_year`**: omettere i campi se non noti o non applicabili — mai passare `null` esplicito
- **`parent_id` sul nodo radice**: presente solo se il seed è annidato dentro un nodo esistente
- **Chiamate in sequenza** — non parallelizzare le create per evitare rate-limit DatoCMS (15 req/s CMA)
- **Descrizioni in italiano** — anche se le ricerche sono in inglese
- **`visibility: "super"`** per i 2–3 nodi più importanti di ogni ramo, `"main"` per gli altri, `"regular"` per i dettagli
- **`event_type: "key_moment"`** per date storiche fondamentali, `"event"` per avvenimenti generici e nodi strutturali, `"incident"` per crisi o rotture

### Paletta colori consigliata

| Colore | Hex | Adatto per |
|--------|-----|-----------|
| Blu profondo | `#1565C0` | acqua, blues, politica |
| Ambra | `#D97706` | jazz, classica, Medioevo |
| Rosso | `#DC2626` | rock, rivoluzioni, guerre |
| Viola | `#7C3AED` | soul, arte, spiritualità |
| Arancione | `#EA580C` | hip-hop, industria, scoperte |
| Ciano | `#0891B2` | elettronica, scienza, mare |
| Verde | `#16A34A` | natura, Rinascimento, biologia |
| Rosa | `#DB2777` | pop, design, moda |
| Ardesia | `#475569` | storia antica, archeologia |
| Oro | `#B45309` | Medioevo, arte sacra, imperiali |

---

## FASE 5 — Esecuzione e report

Esegui lo script con Bash, passando il token via variabile d'ambiente (timeout 300 secondi):

```bash
cd "/Users/spleenteo/Sites/Personal Apps/trama" && DATOCMS_API_TOKEN=c5ff13f9eb2c32512fd8d8d1fae55e npx tsx scripts/seed-[tema].ts 2>&1
```

Riporta all'utente:
- ✓ N nodi radice creati e pubblicati
- ✓ N sotto-temi creati e pubblicati
- ✓ N eventi creati e pubblicati
- ✓ N immagini caricate / ✗ N fallite
- In caso di errore di schema: analizzare il messaggio e proporre correzione prima di rieseguire

---

## Anti-pattern (da evitare sempre)

| ❌ Sbagliato | ✅ Corretto |
|-------------|------------|
| `WebFetch` su Wikipedia (403) | `curl` + Wikipedia API |
| Hardcodare il token nello script | `process.env.DATOCMS_API_TOKEN` |
| Single-quote per stringhe italiane | Double-quote |
| Coprire "tutto il tema" senza focus | Forzare la selezione di 4–6 sotto-temi |
| Generare codice senza mostrare il piano | Mostrare piano → aspettare conferma |
| Slug con accenti o spazi | Slug lowercase ASCII kebab-case |
| Più di 8 nodi di primo livello per seed | Dividere in seed separati |
| `month: null` o `end_year: null` esplicito | Omettere il campo |
| Usare `createCtx()` o `createEv()` | Usare solo `createNode()` |
| `CONTEXT_MODEL` o `EVENT_MODEL` | Solo `NODE_MODEL = "JbziKHLoTUCdJCdTZwWWlg"` |
| `soft_start_year` / `soft_end_year` | `year` / `end_year` |
| `context: childId` negli eventi | `parent_id: childId` |
| Omettere `parent_id` nei sotto-temi | Passare sempre `parent_id: rootId` |
| Dimenticare di chiedere la posizione nella gerarchia | Chiedere sempre root vs. nodo esistente come prima domanda |
