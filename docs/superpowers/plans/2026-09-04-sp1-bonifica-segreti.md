# Sotto-progetto 1 — Bonifica segreti e igiene del repo: piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminare ogni traccia di token dal repo e dalla sua storia, rendere riproducibili le operazioni DatoCMS via CLI e togliere dal tracking i file locali.

**Architecture:** Nessun codice applicativo cambia. Si modificano skill, config, `.gitignore`, `package.json`; poi si riscrive la storia git con `git-filter-repo` e si forza il push. Tutto si fa su `main`, prima di aprire qualsiasi worktree, perché la riscrittura cambia gli hash di tutti i commit.

**Tech Stack:** npm, `datocms` CLI 4.x (OAuth, progetto già linkato in `datocms.config.json`), `git-filter-repo` via Homebrew, `gh`.

**Spec:** `docs/superpowers/specs/2026-09-04-audit-remediation-design.md`, sezione "Sotto-progetto 1".

## Global Constraints

- Ogni operazione DatoCMS passa da `npx datocms ...`; mai MCP.
- Nessun token completo viene mai stampato in output o scritto in file tracciati. Nei log si mostrano al massimo i primi 6 e gli ultimi 4 caratteri.
- I due token da rimuovere dalla storia sono quelli identificati in audit (entrambi già revocati): iniziano con `c5ff13` e `73cf92`. Il file con i valori completi vive solo nella scratchpad della sessione.
- Commit con il trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_01RQh9cTUp8uJSmAQqVbyNKS`.
- Il file `scripts/data/seed-montecristo-roma.json` è dati dell'utente non tracciati: non toccarlo e non committarlo.

---

### Task 1: CLI `datocms` come devDependency

**Files:**
- Modify: `package.json` (devDependencies)
- Modify: `package-lock.json` (rigenerato da npm; contiene già il bump a 0.2.0 non committato)

**Interfaces:**
- Produces: `npx datocms` risolve alla versione locale del progetto.

- [ ] **Step 1: Installare la CLI**

Run: `npm install --save-dev datocms`
Expected: `package.json` contiene `"datocms": "^4.x.x"` in `devDependencies`, nessun errore.

- [ ] **Step 2: Verificare che la CLI usi il progetto linkato**

Run: `npx datocms whoami && npx datocms cma:call site find --json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'], d['name'])"`
Expected: email dell'utente, poi `196935 Trama`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add datocms CLI as devDependency"
```

---

### Task 2: Skill `trama-seed` senza token né path assoluti

**Files:**
- Modify: `.claude/skills/trama-seed/skill.md:13-19` (blocco "Costanti di progetto") e `:271` (comando di esecuzione) e tabella anti-pattern (`:283-296`)
- Modify: `package.json` (script `seed`)
- Modify: `scripts/seed.ts:1-8` (commento d'uso)

**Interfaces:**
- Produces: `npm run seed -- <file.json>` esegue `tsx --env-file=.env.local scripts/seed.ts <file.json>`.

- [ ] **Step 1: Aggiungere lo script npm**

In `package.json`, dentro `"scripts"`, aggiungere dopo `"lint"`:

```json
"seed": "tsx --env-file=.env.local scripts/seed.ts"
```

- [ ] **Step 2: Aggiornare il commento d'uso in `scripts/seed.ts`**

Sostituire le righe 4-5:

```ts
 * Uso:
 *   DATOCMS_API_TOKEN=xxx npx tsx scripts/seed.ts path/to/data.json
```

con:

```ts
 * Uso (il token viene letto da .env.local):
 *   npm run seed -- path/to/data.json
```

- [ ] **Step 3: Aggiornare il blocco costanti della skill**

In `.claude/skills/trama-seed/skill.md` sostituire il blocco:

```
Node model ID    : JbziKHLoTUCdJCdTZwWWlg
API token env    : DATOCMS_API_TOKEN (leggere da .env.local, non hardcodare)
Script generico  : scripts/seed.ts
Formato JSON     : scripts/seed-format.json (riferimento per la struttura)
Runner           : npx tsx
```

con:

```
Node model ID    : JbziKHLoTUCdJCdTZwWWlg
API token env    : DATOCMS_API_TOKEN, letto da .env.local dallo script npm. MAI scriverlo in chat, file o comandi.
Script generico  : scripts/seed.ts
Formato JSON     : scripts/seed-format.json (riferimento per la struttura)
Runner           : npm run seed -- <file.json>   (usa tsx --env-file=.env.local)
Directory        : la root del repo (dove sta package.json); nessun path assoluto
```

- [ ] **Step 4: Sostituire il comando di esecuzione (riga 271)**

Sostituire l'intera riga che inizia con `cd "/Users/spleenteo/Sites/Personal Apps/trama" && DATOCMS_API_TOKEN=` con:

```bash
npm run seed -- scripts/data/seed-[tema-slug].json 2>&1
```

- [ ] **Step 5: Aggiornare la riga anti-pattern sul token**

Sostituire la riga della tabella:

```
| Hardcodare il token nello script | `process.env.DATOCMS_API_TOKEN` |
```

con:

```
| Scrivere il token in script, comandi, chat o documenti | `npm run seed` legge `DATOCMS_API_TOKEN` da `.env.local` |
```

- [ ] **Step 6: Verificare che non restino token o path assoluti**

Run: `git grep -nE '[a-f0-9]{30}|Personal Apps' -- .claude scripts package.json; echo "exit=$?"`
Expected: nessuna riga, `exit=1`.

Run: `npm run seed 2>&1 | tail -3`
Expected: lo script termina con il messaggio d'uso (manca il file JSON), non con un errore di token.

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/trama-seed/skill.md package.json scripts/seed.ts
git commit -m "chore(seed): read DatoCMS token from .env.local, drop hardcoded token from skill"
```

---

### Task 3: `.claude/settings.local.json` fuori dal tracking

**Files:**
- Modify: `.gitignore`
- Untrack: `.claude/settings.local.json` (il file resta su disco)

- [ ] **Step 1: Aggiungere la regola a `.gitignore`**

Sotto la sezione `# AI tooling` aggiungere:

```
.claude/settings.local.json
```

- [ ] **Step 2: Togliere il file dall'indice senza cancellarlo**

Run: `git rm --cached .claude/settings.local.json`
Expected: `rm '.claude/settings.local.json'`; `ls .claude/settings.local.json` mostra ancora il file.

- [ ] **Step 3: Verificare**

Run: `git ls-files .claude`
Expected: solo `skills-lock.json`, `skills/datocms/skill.md`, `skills/trama-seed/skill.md`.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: stop tracking .claude/settings.local.json"
```

---

### Task 4: Rimozione della cartella `memory/`

**Files:**
- Delete: `memory/MEMORY.md`

- [ ] **Step 1: Rimuovere la cartella dal repo**

Run: `git rm -r memory`
Expected: `rm 'memory/MEMORY.md'`.

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove stale Timeo-era memory file"
```

---

### Task 5: `.env.local.example` allineato alle variabili reali

**Files:**
- Modify: `.env.local.example`

- [ ] **Step 1: Riscrivere il file**

Contenuto completo:

```
# Token CMA con accesso completo: usato da scripts/seed.ts (npm run seed)
# e dalle route di editing locale. Mai committarlo.
DATOCMS_API_TOKEN=your_full_access_cma_token_here

# Token CDA read-only: finisce nel bundle del browser, deve poter leggere
# solo contenuti pubblicati.
NEXT_PUBLIC_DATOCMS_API_TOKEN=your_read_only_cda_token_here

# Abilita creazione eventi e drag & drop nella UI (solo sviluppo locale).
# Assente o diverso da "true" = nessuna superficie di scrittura.
TRAMA_EDITING=true
```

- [ ] **Step 2: Verificare che le variabili corrispondano a quelle lette dal codice**

Run: `git grep -hoE 'process\.env\.[A-Z_]+' -- app lib scripts | sort -u`
Expected: `process.env.DATOCMS_API_TOKEN` e `process.env.NEXT_PUBLIC_DATOCMS_API_TOKEN` (TRAMA_EDITING arriva col sotto-progetto 2).

- [ ] **Step 3: Commit**

```bash
git add .env.local.example
git commit -m "docs: align .env.local.example with real variables"
```

---

### Task 6: Riscrittura della storia e force push

**Files:**
- Scratchpad: `<scratchpad>/replacements.txt` (mai nel repo), `<scratchpad>/trama-backup.git` (mirror di backup)
- Repo: tutti i commit vengono riscritti; nessun file di lavoro cambia.

**Interfaces:**
- Consumes: i task 1-5 committati su `main` (la riscrittura deve includerli).

- [ ] **Step 1: Installare git-filter-repo**

Run: `brew install git-filter-repo && git filter-repo --version`
Expected: stampa una versione (es. `2.47.0`).

- [ ] **Step 2: Backup mirror del repo**

Run: `git clone --mirror /Users/spleenteo/Sites/me/trama "$SCRATCH/trama-backup.git" && ls "$SCRATCH/trama-backup.git"`
Expected: cartella con `HEAD`, `objects`, `refs`.

- [ ] **Step 3: Creare il branch locale per `chore/new-shaping`**

filter-repo riscrive solo i ref locali. Run:

```bash
git fetch origin && git branch --track chore/new-shaping origin/chore/new-shaping && git branch -a
```

Expected: compaiono `chore/new-shaping` e `main` tra i locali.

- [ ] **Step 4: Scrivere il file di sostituzione nella scratchpad**

Il file contiene una riga per token, nel formato `<token completo>==>***REMOVED***`. I due token sono quelli trovati in audit (già revocati). Creare il file con un heredoc a partire dai valori noti alla sessione; non committarlo, non stamparlo.

Run: `wc -l "$SCRATCH/replacements.txt"`
Expected: `2`.

- [ ] **Step 5: Eseguire la riscrittura**

Run: `git filter-repo --replace-text "$SCRATCH/replacements.txt" --force`
Expected: `Completely finished after N seconds`. filter-repo rimuove il remote `origin` come misura di sicurezza.

- [ ] **Step 6: Verificare che i token non esistano più in nessun ref**

Run: `git log -p --all | grep -cE 'c5ff13[a-f0-9]{24}|73cf92[a-f0-9]{24}'; git log -p --all | grep -c 'REMOVED'`
Expected: prima riga `0`, seconda riga maggiore di 0.

Run: `git status --short && git log --oneline | wc -l`
Expected: solo il JSON non tracciato; stesso numero di commit di prima (verificare contro `git -C "$SCRATCH/trama-backup.git" log --oneline main | wc -l`).

- [ ] **Step 7: Ripristinare il remote e forzare il push**

```bash
git remote add origin git@github.com:spleenteo/trama.git
git push --force origin main
git push --force origin chore/new-shaping
git fetch origin && git status -sb | head -1
```

Expected: `## main...origin/main` senza ahead/behind.

- [ ] **Step 8: Verificare su GitHub**

Run: `gh api repos/spleenteo/trama/commits/main --jq '.sha' ; git rev-parse main`
Expected: i due hash coincidono.

Run: `gh api "repos/spleenteo/trama/contents/.claude/skills/trama-seed/skill.md" --jq '.content' | base64 -d | grep -cE '[a-f0-9]{30}'`
Expected: `0`.

Nota da riferire all'utente: i commit vecchi restano raggiungibili per hash su GitHub finché GitHub non li purga; si può chiedere al supporto GitHub di eliminarli, ma i token sono già revocati.

- [ ] **Step 9: Pulizia locale**

Run: `git branch -d chore/new-shaping; git reflog expire --expire=now --all && git gc --prune=now --quiet; git count-objects -v | head -3`
Expected: il branch locale sparisce (resta il remoto), gc senza errori.

---

## Verifica finale del sotto-progetto

- [ ] `git grep -nE '[a-f0-9]{30}' -- ':!package-lock.json' ':!*.svg'` → nessun risultato.
- [ ] `git log -p --all | grep -cE 'c5ff13|73cf92'` → `0`.
- [ ] `git ls-files | grep -E 'settings.local|^memory/'` → nessun risultato.
- [ ] `npx datocms whoami` → ok.
- [ ] `npm run seed` senza argomenti → messaggio d'uso.
- [ ] `git status -sb` → `## main...origin/main`, solo il JSON non tracciato.
