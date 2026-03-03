---
shaping: true
---

# Trama Seed — Shaping

Skill riutilizzabile per caricare nuove timeline (contesti + eventi) su DatoCMS per il progetto Trama, guidando l'utente dalla definizione del tema fino alla pubblicazione.

---

## Requirements (R)

| ID | Requisito | Status |
|----|-----------|--------|
| R0 | Guidare l'utente a caricare una timeline completa su DatoCMS — contesti, eventi e immagini — partendo da un tema libero | Core goal |
| R1 | Raccogliere dal dialogo le informazioni necessarie prima di cercare: tema, range temporale, focus, granularità | Must-have |
| R2 | Cercare informazioni aggiornate e accurate via WebSearch e Wikipedia API (curl), non affidarsi solo alla knowledge interna | Must-have |
| R3 | Trovare immagini pubbliche e riutilizzabili (Wikimedia Commons) tramite Wikipedia pageimages API | Must-have |
| R4 | Produrre un piano strutturato (contesti + eventi) da mostrare all'utente prima di procedere con il codice | Must-have |
| R5 | Generare uno script TypeScript (`scripts/seed-*.ts`) compatibile con il pattern già usato in `seed-music.ts` | Must-have |
| R6 | Eseguire lo script con `npx tsx` e riportare l'output (successi, upload falliti) | Must-have |
| R7 | Funzionare per qualsiasi dominio tematico (storia, scienza, arte, sport, politica, ecc.) — non solo musica | Must-have |
| R8 | Gestire errori di upload immagini con graceful fallback (l'evento viene creato senza immagine) | Should-have |
| R9 | Evitare duplicati: usare `skipCreationIfAlreadyExists` per gli upload e slug univoci per i record | Should-have |

---

## Shape A: Dialogo → Ricerca → Piano → Script → Esecuzione

Il workflow procede in 5 fasi sequenziali, ognuna con un output concreto e verificabile dall'utente prima di passare alla successiva.

| Part | Meccanismo |
|------|-----------|
| **A1** | **Comprensione** — Dialogo guidato per raccogliere tema, range temporale, focus e numero di contesti desiderato |
| A1.1 | Chiede il tema (es. "storia della musica", "rivoluzioni scientifiche", "guerre del Novecento") |
| A1.2 | Chiede il range temporale (es. "dal 1900 ad oggi", "solo il XX secolo", "Rinascimento") |
| A1.3 | Chiede il focus o i sotto-temi di interesse (es. "jazz, blues, rock" — non "tutta la musica") |
| A1.4 | Chiede quanti contesti e quanti eventi per contesto (default: 4–6 contesti, 4–5 eventi ciascuno) |
| **A2** | **Ricerca** — Recupero informazioni via WebSearch e Wikipedia API, non dalla knowledge interna |
| A2.1 | WebSearch sul contesto principale per descrizione e date chiave |
| A2.2 | WebSearch sui sub-contesti identificati (uno per uno) per info specifiche |
| A2.3 | WebSearch sugli eventi principali di ogni contesto (artisti, momenti storici, scoperte) |
| A2.4 | Wikipedia pageimages API via `curl` per trovare URL immagini Wikimedia Commons per ogni soggetto |
| **A3** | **Piano** — Tabella strutturata contesti/eventi presentata all'utente per revisione e approvazione |
| A3.1 | Mostra tabella contesti: titolo, slug, anni, colore, immagine trovata |
| A3.2 | Per ogni contesto mostra tabella eventi: titolo, anno, tipo, immagine trovata |
| A3.3 | Attende conferma o modifiche prima di generare il codice |
| **A4** | **Script** — Generazione di `scripts/seed-[tema].ts` seguendo il pattern di `seed-music.ts` |
| A4.1 | Helper `hex()`, `dast()`, `upload()`, `createCtx()`, `createEv()`, `img()` — identici al template |
| A4.2 | Blocchi per ogni contesto: upload immagini → createCtx → loop eventi con createEv |
| A4.3 | Tutto in `main()` con `catch` e `process.exit(1)` in caso di errore |
| **A5** | **Esecuzione** — Esegue `npx tsx scripts/seed-[tema].ts` e riporta output |
| A5.1 | Esegue con Bash tool con tramaut 300000ms |
| A5.2 | Riporta conteggio successi/fallimenti upload e record creati |
| A5.3 | In caso di errori di schema, analizza e suggerisce correzioni |

---

## Fit Check: R × A

| Req | Requisito | Status | A |
|-----|-----------|--------|---|
| R0 | Guidare l'utente a caricare una timeline completa su DatoCMS | Core goal | ✅ |
| R1 | Raccogliere tema, range temporale, focus, granularità dal dialogo | Must-have | ✅ |
| R2 | Cercare via WebSearch e Wikipedia API, non solo knowledge interna | Must-have | ✅ |
| R3 | Trovare immagini Wikimedia Commons via Wikipedia pageimages API | Must-have | ✅ |
| R4 | Produrre piano strutturato per approvazione utente prima del codice | Must-have | ✅ |
| R5 | Generare script TypeScript compatibile con pattern seed-music.ts | Must-have | ✅ |
| R6 | Eseguire lo script e riportare l'output | Must-have | ✅ |
| R7 | Funzionare per qualsiasi dominio tematico | Must-have | ✅ |
| R8 | Graceful fallback per upload immagini falliti | Should-have | ✅ |
| R9 | Evitare duplicati con skipCreationIfAlreadyExists e slug univoci | Should-have | ✅ |

**Shape A soddisfa tutti i requisiti.** Nessuna alternativa necessaria.

---

## Dettaglio A: Fasi e affordances

### Fase 1 — Comprensione (A1)

```
Utente: /trama-seed
Claude: Domanda 1 → tema
Utente: risposta
Claude: Domanda 2 → range temporale + focus
Utente: risposta
Claude: Domanda 3 → granularità (n. contesti, n. eventi)
Utente: risposta
→ output: brief confermato prima di cercare
```

**Domande chiave da porre sempre:**
1. *Qual è il tema della timeline?* (es. storia della fotografia, evoluzione del cinema)
2. *C'è un range temporale specifico?* (es. solo dal 1900, solo il Medioevo, tutto il XX secolo)
3. *Quali sono i sotto-temi o periodi principali che ti interessano?* (forzare la selezione, non coprire tutto)
4. *Quanti contesti vuoi creare? Quanti eventi per contesto?* (default: 4–6 / 4–5)
5. *C'è un taglio particolare: geografico, culturale, per personaggi chiave?*

### Fase 2 — Ricerca (A2)

**Sequenza di ricerche (eseguire in parallel dove possibile):**

```
1. WebSearch: "[tema] history overview key dates [range]"
2. WebSearch: per ogni sub-contesto identificato
3. Per ogni contesto: WebSearch "[contesto] key figures events timeline"
4. Wikipedia API: per ogni soggetto da fotografare
   curl "https://en.wikipedia.org/w/api.php?action=query&titles=[ARTICLE]&prop=pageimages&piprop=original&format=json"
```

**Regole per le ricerche:**
- Cercare in inglese per avere più risultati (le descrizioni saranno poi scritte in italiano)
- Usare Wikipedia API curl, non WebFetch (Wikipedia blocca il WebFetch con 403)
- Per immagini: preferire foto d'epoca o pubblicitarie (meno restrizioni copyright)
- Se un'immagine fallisce l'upload, non bloccare: l'evento viene creato senza immagine

### Fase 3 — Piano strutturato (A3)

**Prima di scrivere codice, mostrare sempre:**

```markdown
## Piano: [Tema]

### Contesti (6)
| # | Titolo | Slug | Anni | Colore | Immagine |
|---|--------|------|------|--------|----------|
| 1 | Blues  | blues | 1900– | #1565C0 | ✓ Bessie Smith |
| 2 | Jazz   | jazz  | 1895– | #D97706 | ✓ Louis Armstrong |
...

### Eventi per contesto
#### Blues (5 eventi)
| Anno | Titolo | Tipo | Visibility | Immagine |
|------|--------|------|------------|----------|
| 1920 | Mamie Smith — Crazy Blues | key_moment | super | ✗ nessuna |
| 1923 | Bessie Smith — Downhearted Blues | key_moment | super | ✓ |
...
```

Attendere conferma esplicita dell'utente prima di procedere.

### Fase 4 — Script (A4)

**Template dello script da seguire sempre:**

```typescript
import { buildClient } from "@datocms/cma-client-node";

const client = buildClient({ apiToken: process.env.DATOCMS_API_TOKEN ?? "" });
// Leggere il token da .env.local, non hardcodarlo

const CONTEXT_MODEL = "OdF30qLZRyWRfVMi_8lTjg";
const EVENT_MODEL   = "Vg_FXz7USqmlzYQl8sMKVw";

// helper hex(), dast(), upload(), createCtx(), createEv(), img()
// blocchi per contesto: upload immagini → createCtx → eventi
// main() con catch
```

**Vincoli di codice:**
- Usare `process.env.DATOCMS_API_TOKEN` (non hardcodare il token)
- Stringhe in italiano con double-quote (le apostrofi rompono i single-quote)
- `skipCreationIfAlreadyExists: true` su ogni upload
- Chiamate in sequenza per evitare rate-limit DatoCMS (15 req/s CMA)
- Slug sempre lowercase, kebab-case, ASCII (no accenti)
- `visibility`: `"super"` per eventi fondamentali, `"main"` per importanti, `"regular"` per dettaglio
- `event_type`: `"key_moment"` per date storiche, `"event"` per eventi generici, `"incident"` per crisi

### Fase 5 — Esecuzione (A5)

```bash
cd "/Users/spleenteo/Sites/Personal Apps/trama" && DATOCMS_API_TOKEN=73cf92a8063412336c282a6f085a23 npx tsx scripts/seed-[tema].ts
```

Riportare all'utente:
- N. contesti creati e pubblicati
- N. eventi creati e pubblicati
- N. immagini caricate / N. fallite
- Eventuali errori di schema con suggerimenti di fix

---

## Costanti DatoCMS (Trama)

```
Context model ID : OdF30qLZRyWRfVMi_8lTjg
Event model ID   : Vg_FXz7USqmlzYQl8sMKVw
Tag model ID     : Ys2Ty3MBTpa2_Bo2UFjRLA
API token        : 73cf92a8063412336c282a6f085a23
```

**Enum values:**
- `visibility`: `regular` | `main` | `super`
- `event_type`: `event` | `incident` | `key_moment`

---

## Paletta colori consigliata per contesti

| Colore | Hex | Adatto per |
|--------|-----|-----------|
| Blu profondo | `#1565C0` | acqua, blues, politica |
| Ambra | `#D97706` | jazz, dopoguerra, deserto |
| Rosso | `#DC2626` | rock, rivoluzioni, guerre |
| Viola | `#7C3AED` | soul, arte, spiritualità |
| Arancione | `#EA580C` | hip-hop, rivoluzione industriale |
| Ciano | `#0891B2` | elettronica, scienza, mare |
| Verde | `#16A34A` | natura, Rinascimento, classica |
| Rosa | `#DB2777` | pop, design, moda |
| Grigio ardesia | `#475569` | storia antica, archeologia |
| Oro | `#B45309` | storia medievale, arte sacra |

---

## Anti-pattern da evitare

- ❌ Usare WebFetch su Wikipedia (risponde 403) → usare WebSearch + curl Wikipedia API
- ❌ Hardcodare il token API nello script → usare variabile d'ambiente o passarlo via shell
- ❌ Single-quote per stringhe italiane → usare double-quote (le apostrofi rompono il parsing)
- ❌ Coprire tutto il tema senza focus → forzare la selezione di sotto-temi specifici
- ❌ Creare più di 8 contesti in un seed → preferire più seed separati o sub-contesti figli
- ❌ Slug con caratteri speciali o accenti → sempre lowercase ASCII kebab-case
- ❌ Chiamare il piano "completo" senza mostrarlo all'utente → aspettare conferma esplicita
