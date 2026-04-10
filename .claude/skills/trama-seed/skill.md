---
name: trama-seed
description: Skill per caricare nuove timeline su DatoCMS per il progetto Trama. Guida l'utente dalla definizione del tema fino alla pubblicazione di nodi e immagini nell'alberatura nodi.
---

# Trama Seed — Carica una nuova timeline

Quando questa skill viene invocata, segui le **5 fasi** descritte di seguito in ordine. Non saltare fasi e non generare il JSON prima di aver mostrato il piano all'utente e ricevuto conferma.

---

## Costanti di progetto

```
Node model ID    : JbziKHLoTUCdJCdTZwWWlg
API token env    : DATOCMS_API_TOKEN (leggere da .env.local, non hardcodare)
Script generico  : scripts/seed.ts
Formato JSON     : scripts/seed-format.json (riferimento per la struttura)
Runner           : npx tsx
```

**Enum DatoCMS:**
- `visibility`: `regular` | `main` | `super`
- `event_type`: `event` | `incident` | `key_moment`

---

## FASE 1 — Comprensione (dialogo con l'utente)

Questa fase è una **conversazione**, non un questionario. L'obiettivo è capire il punto di vista, lo sguardo, l'interesse specifico dell'utente. Ogni tema può essere raccontato in mille modi diversi — la stessa "storia del karate" cambia radicalmente se l'interesse è sulle radici okinawensi, sull'espansione sportiva mondiale, o sulle filosofie dietro gli stili. Queste sfumature modificano drasticamente i risultati.

### Come condurre il dialogo

- **Non sparare tutte le domande insieme.** Parti dal tema, ascolta la risposta, e da quella formula le domande successive. Le risposte dell'utente spesso contengono già indicazioni su range, taglio e focus.
- **Fai domande di approfondimento** quando l'utente è vago. Non dare per scontato nulla. Esempi:
  - "La storia del karate" → "Ti interessa l'evoluzione degli stili e delle scuole, la dimensione sportiva, o il percorso dall'Okinawa al mondo? O un mix?"
  - "Una timeline sulla musica" → "Quale aspetto ti affascina di più: l'evoluzione dei generi, i personaggi chiave, il contesto sociale che ha generato certi movimenti?"
  - "Voglio raccontare il Rinascimento" → "Da che angolo? L'arte, la scienza, la politica? Tutto insieme ma con un filo conduttore? C'è un protagonista o una città che ti interessa di più?"
- **Proponi angoli narrativi** se l'utente non ne ha uno chiaro. "Possiamo raccontare X dal punto di vista di...", "Un taglio interessante potrebbe essere..."
- **Se l'utente fornisce un file**, leggilo PRIMA di fare le domande di focus. Il file stesso rivela il punto di vista dell'autore, e puoi formulare domande più mirate: "Barbero racconta Napoleone attraverso il paradosso rivoluzione/dispotismo — vuoi mantenere questo filo conduttore?"

### Informazioni da raccogliere (non necessariamente in quest'ordine)

Le informazioni qui sotto devono emergere dal dialogo. Alcune le fornirà l'utente spontaneamente, altre le dovrai chiedere. L'unica domanda da porre sempre per prima è la posizione nella gerarchia.

0. **Posizione nella gerarchia** _(chiedere sempre per prima)_ — Il seed deve essere inserito alla **root** (nodo di primo livello, visibile in homepage) oppure **dentro un nodo esistente**?
   - Se dentro un nodo esistente: chiedi l'**ID DatoCMS** del nodo genitore (es. `abc123XYZ`). Salvalo come `PARENT_RECORD_ID`.
   - Se alla root: `PARENT_RECORD_ID = null` (il nodo radice del seed non avrà `parent_id`).

1. **Tema e punto di vista** — Non solo "qual è il tema" ma "come vuoi raccontarlo". Qual è l'angolo, la tesi, il filo narrativo? Cosa rende questa timeline diversa da una voce di Wikipedia?

2. **Range temporale** — C'è un periodo specifico? A volte emerge dal punto di vista stesso.

3. **Focus e sotto-temi** — Quali assi o categorie? Fai proposte concrete basate su quello che hai capito del punto di vista. Evitare di coprire "tutto": scegliere aree specifiche.

4. **Taglio** — Geografico, culturale, per protagonisti? Anche qui, spesso è implicito nel punto di vista.

5. **Fonte e livello di ricerca** — Chiedi **sempre** questi due aspetti separatamente:

   > **Fonte dei contenuti:**
   > - **📁 File locale** — Ho un file (Markdown, CSV, testo) con i contenuti da usare come fonte primaria.
   > - **🌐 Solo web** — Nessun file, costruisci tutto da ricerca web e knowledge interna.
   > - **📁+🌐 File + web** — Ho un file come fonte primaria, ma arricchisci con ricerca web.
   >
   > **Livello di ricerca web:**
   > - **⛔ Nessuna** — Zero ricerche web. Solo file locale e/o knowledge interna. Max 2–3 immagini per i soggetti principali.
   > - **⚡ Veloce** — 1–2 ricerche web per il tema. Date precise, immagini per i nodi principali. Descrizioni: 1 frase per nodo.
   > - **📋 Media** — Ricerche per tema + sotto-temi. Immagini per nodi principali e top eventi. Descrizioni: 1–2 paragrafi.
   > - **🔬 Approfondita** — Ricerche estese su tutto. Immagini ovunque. Descrizioni: 2–3 paragrafi ricchi. Arricchisce ogni nodo con info da Wikipedia. Può aggiungere nodi e sotto-timeline che nella fonte mancano.

   Salva come `FONTE` e `LIVELLO_RICERCA`.

   Se la fonte include un file locale, chiedi il **percorso del file**. Salvalo come `FILE_SORGENTE`.

   > **Nota:** le due scelte sono indipendenti ma si influenzano:
   > - 📁 + ⛔: il file detta tutto, niente web
   > - 📁 + ⚡/📋: il file resta primario, il web aggiunge date, immagini, colma buchi
   > - 📁 + 🔬: il file resta primario per i nodi chiave, il web arricchisce con info Wikipedia per ogni nodo e aggiunge nodi mancanti
   > - 🌐 + qualsiasi livello: tutto da ricerca (la skill guida il dialogo su tema, focus, taglio)
   > - Combinazioni comuni: 📁+🌐 con livello 📋 (media), oppure 🌐 con 📋 o 🔬

Prima di passare alla Fase 2, riepiloga il brief completo (posizione, fonte, livello) e chiedi conferma.

---

## FASE 2 — Ricerca

### Regole generali

- **Il numero di nodi non è vincolato dal livello di ricerca.** Se il tema richiede 15 stili di karate, se ne fanno 15. Il livello di ricerca influenza la *ricchezza* di ogni nodo (descrizioni, immagini), non il numero.
- **Se c'è un file locale, le descrizioni usano il testo originale** — citazioni dirette, frasi dell'autore, il tono della fonte. Non parafrasare in stile enciclopedico.
- **La ricerca web non sovrascrive mai il file locale** — lo arricchisce e lo completa.

### Comportamento per combinazione

#### 📁 File locale (con qualsiasi livello di ricerca)

1. Leggi il file indicato (`FILE_SORGENTE`) con il tool Read.
2. Estrai la struttura: date, nomi, eventi, gerarchia, citazioni rilevanti.
3. Usa il testo originale per le descrizioni dei nodi.
4. In base al livello di ricerca web:

| Livello | Cosa aggiunge il web |
|---------|---------------------|
| ⛔ Nessuna | Niente. Solo knowledge interna per disambiguare date incerte. Max 2–3 immagini Wikipedia per i soggetti principali (1 chiamata curl). |
| ⚡ Veloce | Date precise dove il file è vago. Immagini per radice + sotto-temi. 1–2 ricerche WebSearch. |
| 📋 Media | Date + immagini per nodi principali e top eventi. Ricerche per tema + sotto-temi. Colma buchi nel file. |
| 🔬 Approfondita | Tutto quanto sopra + arricchisce ogni nodo con contesto da Wikipedia. Aggiunge nodi e sotto-timeline che nel file mancano. Ricerche estese su tutti i sotto-temi e singoli eventi. |

#### 🌐 Solo web (senza file locale)

La Fase 1 ha già raccolto tema, focus, taglio. Procedi con ricerche web in base al livello:

| Livello | Strategia |
|---------|-----------|
| ⚡ Veloce | 1–2 WebSearch per il tema principale. Nodi con titolo + data + 1 frase. Immagini solo radice + sotto-temi. |
| 📋 Media | WebSearch per tema + ogni sotto-tema. Descrizioni 1–2 paragrafi. Immagini per nodi principali + top eventi. |
| 🔬 Approfondita | WebSearch estese: tema, sotto-temi, singoli eventi. Descrizioni 2–3 paragrafi. Immagini ovunque. Sotto-timeline nestate se ha senso. |

> Nota: 🌐 + ⛔ (solo web senza ricerca) è un caso limite — usa solo la knowledge interna. Accettabile per argomenti molto noti.

### Ricerca immagini (per tutti i livelli tranne ⛔ senza immagini)

Per ogni soggetto usa **curl + Wikipedia API** — non WebFetch che riceve 403:

```bash
curl -s "https://en.wikipedia.org/w/api.php?action=query&titles=ARTICLE_1|ARTICLE_2|ARTICLE_3&prop=pageimages&piprop=original&format=json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for p in data['query']['pages'].values():
    print(p.get('title'), ':', p.get('original', {}).get('source', 'NO_IMAGE'))
"
```

Max 10 titoli per chiamata, separati da `|`.

> ⚠️ Se un'immagine non si trova, non bloccare — il nodo verrà creato senza immagine.

---

## FASE 3 — Piano strutturato (mostrare e attendere conferma)

**Prima di generare il JSON**, mostra all'utente il piano completo in formato tabellare e attendi conferma esplicita.

### Struttura sempre richiesta: 1 nodo radice + N nodi figli

Ogni seed deve creare **sempre**:
1. **Un nodo radice** — rappresenta il tema principale.
   - Se `PARENT_RECORD_ID` è valorizzato, questo nodo avrà `parent_id: PARENT_RECORD_ID`.
   - Se `PARENT_RECORD_ID` è null, non avrà `parent_id` (nodo di primo livello in homepage).
2. **N nodi figli (sotto-temi)** — i periodi/generi/categorie, collegati al nodo radice.
3. **Nodi foglia (eventi)** — collegati al rispettivo nodo figlio.

### Formato tabella piano

```markdown
## Piano: [Tema] ([range])

**Fonte:** [📁 File / 🌐 Web / 📁+🌐 File + Web] — **Livello:** [⛔/⚡/📋/🔬]
**Posizione:** [root / figlio di ID=PARENT_RECORD_ID]

### Nodo radice
| Titolo | Slug | Anni | Colore | Immagine |
|--------|------|------|--------|----------|
| ... | ... | ... | ... | ... |

### Nodi figli ([N] totali) — figli del nodo radice
| # | Titolo | Slug | Anni | Colore | Immagine |
|---|--------|------|------|--------|----------|
| 1 | ... | ... | ... | ... | ... |

#### [Sotto-tema 1] — [N] eventi
| Anno | Titolo | Tipo | Visibility | Immagine |
|------|--------|------|------------|----------|
| ... | ... | ... | ... | ... |
```

Attendi `sì`, `ok`, `procedi` o una modifica esplicita prima di passare alla Fase 4.

---

## FASE 4 — Generazione JSON

Genera il file `scripts/data/seed-[tema-slug].json` seguendo il formato documentato in `scripts/seed-format.json`.

### Formato JSON

```json
{
  "parent_id": null,
  "nodes": [
    {
      "title": "Titolo Nodo",
      "slug": "titolo-nodo",
      "year": 1900,
      "end_year": 2000,
      "month": 3,
      "day": 15,
      "color": "#DC2626",
      "visibility": "super",
      "event_type": "event",
      "description": [
        "Primo paragrafo della descrizione.",
        "Secondo paragrafo della descrizione."
      ],
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/...",
      "image_title": "Titolo dell'immagine",
      "children": []
    }
  ]
}
```

### Campi del nodo

| Campo | Obbligatorio | Tipo | Note |
|-------|-------------|------|------|
| `title` | ✓ | string | Titolo del nodo. Usare double-quote. |
| `slug` | ✓ | string | Lowercase, kebab-case, ASCII puro (no accenti). |
| `year` | ✓ | number | Anno di inizio (intero). |
| `end_year` | | number | Anno di fine. Omettere se non applicabile. |
| `month` | | number | Mese (1–12). Per posizionare l'evento nell'anno. |
| `day` | | number | Giorno (1–31). Solo se il mese è noto. |
| `color` | | string | Hex `#RRGGBB`. Utile per sotto-temi. I foglia ereditano dal padre. |
| `visibility` | | string | `"super"` (2–3 più importanti) / `"main"` (default) / `"regular"` (dettagli). |
| `event_type` | | string | `"event"` (default) / `"key_moment"` (date fondamentali) / `"incident"` (crisi). |
| `description` | | string[] | Array di stringhe, ogni stringa = un paragrafo. In italiano. |
| `image_url` | | string | URL immagine da Wikimedia Commons o fonte pubblica. |
| `image_title` | | string | Titolo/alt immagine. Se omesso, usa `title`. |
| `children` | | node[] | Array di nodi figli, stessa struttura. Ricorsivo, profondità illimitata. |

### Campi top-level del file

| Campo | Tipo | Note |
|-------|------|------|
| `parent_id` | string \| null | ID DatoCMS del nodo genitore. `null` = root (homepage). |
| `nodes` | node[] | Array di nodi di primo livello da creare. |

### Regole obbligatorie

- **`slug`**: sempre lowercase, kebab-case, ASCII puro — no accenti, no spazi
- **Campi opzionali**: omettere completamente se non noti — mai passare `null`
- **`description`**: sempre in italiano. Se c'è un file locale, privilegiare il testo originale della fonte.
- **`visibility: "super"`** per i 2–3 nodi più importanti di ogni ramo, `"main"` per gli altri, `"regular"` per i dettagli
- **`event_type: "key_moment"`** per date storiche fondamentali, `"event"` per avvenimenti generici e nodi strutturali, `"incident"` per crisi o rotture
- **Massimo 8 nodi di primo livello** per seed — dividere in seed separati se necessario
- **L'albero è ricorsivo**: i `children` di un nodo diventano figli di quel nodo su DatoCMS. Profondità illimitata.

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

Esegui lo script generico passando il file JSON (timeout 300 secondi):

```bash
cd "/Users/spleenteo/Sites/Personal Apps/trama" && DATOCMS_API_TOKEN=c5ff13f9eb2c32512fd8d8d1fae55e npx tsx scripts/seed.ts scripts/data/seed-[tema-slug].json 2>&1
```

Riporta all'utente:
- ✓ N nodi creati e pubblicati
- ✓ N immagini caricate / ✗ N fallite
- In caso di errore di schema: analizzare il messaggio e proporre correzione al JSON prima di rieseguire

---

## Anti-pattern (da evitare sempre)

| ❌ Sbagliato | ✅ Corretto |
|-------------|------------|
| Generare uno script TypeScript ad hoc per ogni seed | Generare solo il JSON, usare `scripts/seed.ts` |
| Non chiedere fonte e livello di ricerca | Chiedere **sempre** entrambi gli assi |
| Parafrasare il file locale in stile enciclopedico | Usare il testo originale della fonte per le descrizioni |
| Sovrascrivere la fonte locale con info da web | Il web arricchisce, non sovrascrive |
| Limitare rigidamente il numero di nodi per livello | Il livello influenza la ricchezza per nodo, non il numero totale |
| `WebFetch` su Wikipedia (403) | `curl` + Wikipedia API |
| Hardcodare il token nello script | `process.env.DATOCMS_API_TOKEN` |
| Single-quote per stringhe italiane | Double-quote |
| Coprire "tutto il tema" senza focus | Forzare la selezione di sotto-temi |
| Generare il JSON senza mostrare il piano | Mostrare piano → aspettare conferma |
| Slug con accenti o spazi | Slug lowercase ASCII kebab-case |
| Più di 8 nodi di primo livello per seed | Dividere in seed separati |
| Passare `null` per campi opzionali | Omettere il campo |
| Dimenticare di chiedere la posizione nella gerarchia | Chiedere sempre root vs. nodo esistente come prima domanda |
