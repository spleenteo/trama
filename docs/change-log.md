## v0.2.0 — 2026-04-10 — Zoom ai mesi, seed generico, label overflow per barre strette

Tre miglioramenti principali alla timeline e al tooling di seed dei contenuti.

- **Zoom sub-anno**: l'asse temporale ora mostra label mensili (gen, feb, mar...) quando il livello di zoom lo richiede. Step frazionari 1/12, 1/4, 1/2 aggiunti a `getAxisLabels()`. MAX_PPY alzato da 400 a 5000.
- **Precisione mese/giorno nei range**: `computeTreeRanges` e gli event dots ora usano `eventToFractionalYear()` per calcolare start/end con precisione sub-anno. `month`/`day` promossi in `NodeBase` e aggiunti a tutte le query GraphQL.
- **Label sempre visibili per barre strette**: sub-timeline con range brevissimo (es. Waterloo, 1 anno) ora mostrano il titolo posizionato a destra della barra, invece di nasconderlo. Applicato sia a `SubTimelineBars` che a `GhostBars`.
- **Script seed generico**: nuovo `scripts/seed.ts` che legge un file JSON e crea ricorsivamente i nodi su DatoCMS. Elimina la necessita di generare script TypeScript ad hoc per ogni seed.
- **Skill trama-seed aggiornata**: la skill ora genera JSON invece di script, chiede fonte (locale/web) e livello di ricerca come due assi indipendenti, e conduce un dialogo esplorativo per capire il punto di vista dell'utente.
- **Seed Napoleone**: timeline completa creata su DatoCMS (34 nodi: Storia > Napoleone > 5 sotto-temi > 27 eventi, inclusa la battaglia di Waterloo ora per ora).

---
