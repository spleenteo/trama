import { buildClient } from "@datocms/cma-client-node";

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

async function createNode(fields: Record<string, unknown>) {
  const item = await client.items.create({ item_type: { type: "item_type", id: NODE_MODEL }, ...fields });
  await client.items.publish(item.id);
  console.log(`  ✓ nodo: ${fields.title} (${fields.year ?? ""})`);
  return item.id;
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {

  // ── CONTESTO RADICE ───────────────────────────────────────────────────────
  console.log("\n🟦 DatoCMS — Contesto radice");

  const rootId = await createNode({
    title: "DatoCMS",
    slug: "datocms",
    color: hex("#0891B2"),
    year: 2015,
    concluded: false,
    visibility: "super",
    event_type: "event",
    description: dast(
      "DatoCMS è un headless CMS italiano fondato nel 2015 a Firenze dal team di LeanPanda. Offre un'interfaccia di editing visuale, una potente API GraphQL e un ecosistema di integrazioni per framework moderni come Next.js, Nuxt, Astro e SvelteKit.",
      "Azienda bootstrapped, profittevole e indipendente, DatoCMS è cresciuta fino a raggiungere oltre 6 milioni di euro di ricavi annuali nel 2024 con un team di soli 13 persone e oltre 185 agenzie partner nel mondo."
    ),
  });

  // ── SUB-CONTESTO 1: Origini e lancio ─────────────────────────────────────
  console.log("\n🟣 Sub-contesto 1: Origini e lancio");

  const ctx1Id = await createNode({
    title: "Origini e lancio",
    slug: "datocms-origini",
    parent_id: rootId,
    color: hex("#7C3AED"),
    year: 2015,
    end_year: 2019,
    concluded: true,
    visibility: "super",
    event_type: "event",
    description: dast(
      "DatoCMS nasce nel 2015 come strumento interno dell'agenzia creativa LeanPanda di Firenze, per rispondere alla frustrazione quotidiana di lavorare con CMS tradizionali e WYSIWYG goffi.",
      "In pochi anni diventa un prodotto indipendente, si separa dall'agenzia madre e si afferma come uno dei headless CMS di riferimento per sviluppatori e agenzie digitali in tutto il mondo."
    ),
  });

  await createNode({
    title: "Fondazione di DatoCMS a Firenze",
    slug: "datocms-fondazione-2015",
    parent_id: ctx1Id,
    year: 2015,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "DatoCMS viene fondato a Firenze dal team di LeanPanda, un'agenzia creativa italiana. I fondatori sono Stefano Verna (CEO), Luca Bonfiglio (CFO) e Matteo Papadopoulos (Sales & Partners). Nasce come strumento interno per gestire i contenuti dei clienti dell'agenzia.",
      "La frustrazione con i CMS esistenti — WYSIWYG ingombranti, API assenti, scarsa flessibilità — spinge il team a costruire qualcosa di nuovo: un CMS headless pensato per gli sviluppatori moderni."
    ),
  });

  await createNode({
    title: "Prima versione pubblica del prodotto",
    slug: "datocms-lancio-pubblico-2016",
    parent_id: ctx1Id,
    year: 2016,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "DatoCMS viene reso disponibile pubblicamente come prodotto SaaS. Le prime caratteristiche distintive includono un'interfaccia di editing pulita, un sistema flessibile di modelli di contenuto e un'API REST per la distribuzione dei contenuti.",
      "La scelta di essere bootstrapped — senza venture capital — è deliberata: il team vuole crescere in modo sostenibile, mantenendo il controllo del prodotto e restando vicino alle esigenze reali dei clienti."
    ),
  });

  await createNode({
    title: "Draft/Published records — primo workflow editoriale",
    slug: "datocms-draft-published-2018",
    parent_id: ctx1Id,
    year: 2018,
    month: 3,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Viene introdotto il sistema Draft/Published: gli editor possono salvare i contenuti come bozze e pubblicarli solo quando sono pronti. È la prima funzionalità di workflow editoriale strutturato della piattaforma.",
      "Questa feature segna il passaggio da semplice repository di contenuti a strumento di lavoro per team editoriali con processi di revisione e approvazione."
    ),
  });

  await createNode({
    title: "Indipendenza da LeanPanda — azienda autonoma e profittevole",
    slug: "datocms-indipendenza-2019",
    parent_id: ctx1Id,
    year: 2019,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "DatoCMS diventa ufficialmente un'azienda indipendente, separata dall'agenzia LeanPanda. Il team è dedicato esclusivamente al prodotto, con una struttura organizzativa autonoma e una base clienti in forte crescita.",
      "Già profittevole, DatoCMS dimostra che è possibile costruire un'azienda SaaS di successo nel mercato internazionale partendo dall'Italia e senza ricorrere a investitori esterni."
    ),
  });

  await createNode({
    title: "Lancio del community forum datocms.com/community",
    slug: "datocms-community-forum-2019",
    parent_id: ctx1Id,
    year: 2019,
    month: 8,
    visibility: "regular",
    event_type: "event",
    description: dast(
      "Viene lanciato il forum della community su Discourse. Gli sviluppatori possono ora condividere soluzioni, chiedere supporto e discutere best practice direttamente con il team di DatoCMS.",
      "Nello stesso periodo, le richieste all'API GraphQL sono cresciute di dieci volte rispetto a sei mesi prima, segnale della rapida adozione della piattaforma."
    ),
  });

  // ── SUB-CONTESTO 2: Content Modeling ─────────────────────────────────────
  console.log("\n🟡 Sub-contesto 2: Content Modeling");

  const ctx2Id = await createNode({
    title: "Content Modeling",
    slug: "datocms-content-modeling",
    parent_id: rootId,
    color: hex("#D97706"),
    year: 2018,
    end_year: 2022,
    concluded: true,
    visibility: "super",
    event_type: "event",
    description: dast(
      "L'evoluzione del sistema di modellazione dei contenuti è il cuore dello sviluppo di DatoCMS. Dai semplici campi testo si arriva a uno dei sistemi di editing strutturato più potenti del panorama headless CMS.",
      "Il percorso include il Plugin SDK per l'estensibilità, la gestione avanzata dei media con AI, il rivoluzionario formato DAST per il testo strutturato e i blocchi annidati illimitati."
    ),
  });

  await createNode({
    title: "Plugin SDK v1 — il CMS diventa estensibile",
    slug: "datocms-plugin-sdk-v1-2018",
    parent_id: ctx2Id,
    year: 2018,
    month: 10,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Viene lanciato il Plugin SDK v1: piccole applicazioni HTML5 in iframe sandboxed che si integrano nell'interfaccia del CMS tramite un SDK JavaScript. I developer possono creare campi personalizzati, sidebar panel e widget.",
      "Descritto internamente come la funzionalità più attesa di sempre, il Plugin SDK trasforma DatoCMS da CMS rigido a piattaforma aperta. Nascono plugin per color picker, SEO analyzer, integrazioni con servizi terzi e molto altro."
    ),
  });

  await createNode({
    title: "Nuova Media Area: AI tagging, Mux video, BlurHash",
    slug: "datocms-media-area-2019",
    parent_id: ctx2Id,
    year: 2019,
    month: 12,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Viene rilasciata una Media Area completamente rinnovata. Ogni progetto DatoCMS ottiene integrazione nativa con Mux per lo streaming video. Il riconoscimento immagini basato su AI genera tag automatici per tutti gli asset.",
      "Vengono introdotti anche BlurHash per i placeholder delle immagini, estrazione del colore dominante, dati EXIF, rilevamento duplicati via MD5 e organizzazione avanzata delle risorse. Una delle release più ricche della storia del prodotto."
    ),
  });

  await createNode({
    title: "Structured Text e formato DAST",
    slug: "datocms-structured-text-2021",
    parent_id: ctx2Id,
    year: 2021,
    month: 2,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Viene lanciato il campo Structured Text con il formato DAST (DatoCMS Abstract Syntax Tree): un editor WYSIWYG moderno ispirato a Notion, con slash commands, markdown shortcuts e drag & drop.",
      "Il contenuto è salvato come JSON semantico conforme agli standard della comunità Unified, garantendo portabilità e componibilità. I blocchi custom possono essere annidati nel testo, e i record del CMS possono essere linkati inline. Una svolta per la creazione di contenuti ricchi e strutturati."
    ),
  });

  await createNode({
    title: "Nested Blocks — blocchi annidati illimitati",
    slug: "datocms-nested-blocks-2021",
    parent_id: ctx2Id,
    year: 2021,
    month: 10,
    visibility: "main",
    event_type: "event",
    description: dast(
      "I campi Modular Content ora supportano blocchi annidati a più livelli: un blocco può contenere altri blocchi, che a loro volta ne contengono altri. Era la funzionalità più richiesta sul forum della community.",
      "Con i nested blocks, DatoCMS può modellare strutture di contenuto complesse come landing page componibili, layout a sezioni articolate e documenti gerarchici arbitrariamente profondi."
    ),
  });

  await createNode({
    title: "Plugin SDK v2 con TypeScript e nuovi hook",
    slug: "datocms-plugin-sdk-v2-2021",
    parent_id: ctx2Id,
    year: 2021,
    month: 12,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Il Plugin SDK viene completamente riscritto in TypeScript. I plugin possono ora registrare più hook: campi personalizzati, sidebar panel, pagine custom, modal, dashboard widget e asset source.",
      "Viene rilasciata la libreria datocms-react-ui con componenti React pronti all'uso per costruire interfacce coerenti con l'aspetto del CMS. Tutti i plugin esistenti rimangono retrocompatibili."
    ),
  });

  // ── SUB-CONTESTO 3: Developer Experience ─────────────────────────────────
  console.log("\n🔵 Sub-contesto 3: Developer Experience");

  const ctx3Id = await createNode({
    title: "Developer Experience",
    slug: "datocms-developer-experience",
    parent_id: rootId,
    color: hex("#1565C0"),
    year: 2017,
    end_year: 2024,
    concluded: true,
    visibility: "super",
    event_type: "event",
    description: dast(
      "DatoCMS si distingue nel mercato headless CMS per la qualità dell'esperienza di sviluppo: API GraphQL, SDK tipizzati, integrazioni ufficiali con i framework più diffusi e strumenti CLI avanzati.",
      "Dalla prima integrazione con Gatsby nel 2017 al lancio dei Cache Tags nel 2024, ogni iterazione mira a ridurre la complessità per lo sviluppatore e aumentare le performance delle applicazioni."
    ),
  });

  await createNode({
    title: "gatsby-source-datocms — prima integrazione JAMstack",
    slug: "datocms-gatsby-plugin-2017",
    parent_id: ctx3Id,
    year: 2017,
    month: 12,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Viene rilasciato gatsby-source-datocms v1.0, uno dei primi source plugin nell'ecosistema Gatsby. Gli sviluppatori possono ora estrarre tutti i contenuti di DatoCMS nel layer GraphQL di Gatsby durante la build.",
      "Questa integrazione anticipa l'esplosione del movimento JAMstack e posiziona DatoCMS come CMS di riferimento per i siti statici moderni, aprendo la strada a partnership con Netlify, Vercel e altri provider."
    ),
  });

  await createNode({
    title: "GraphQL Content Delivery API",
    slug: "datocms-graphql-cda-2018",
    parent_id: ctx3Id,
    year: 2018,
    month: 5,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "DatoCMS rilascia la GraphQL Content Delivery API, spostando l'architettura da REST-only a GraphQL. L'API è servita da una CDN globale ad alta velocità e supporta query introspection, filtering avanzato e paginazione.",
      "Questo cambiamento architetturale apre DatoCMS a use case oltre i siti statici: app mobile, SPA, realtà virtuale, server-side rendering. GraphQL diventa rapidamente il canale predominante per il delivery dei contenuti."
    ),
  });

  await createNode({
    title: "GraphQL Real-Time Updates API",
    slug: "datocms-realtime-updates-2020",
    parent_id: ctx3Id,
    year: 2020,
    month: 11,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Viene lanciata la GraphQL Real-Time Updates API: le modifiche ai contenuti vengono streamed in tempo reale agli iscritti via Server-Sent Events (SSE). Disponibile su tutti i piani senza costi aggiuntivi.",
      "Gli sviluppatori possono implementare anteprime live che si aggiornano mentre il redattore digita, senza polling. L'integrazione con Next.js Draft Mode e altri framework diventa immediata e fluida."
    ),
  });

  await createNode({
    title: "Nuova CLI TypeScript con migration scripts autogenerati",
    slug: "datocms-cli-typescript-2022",
    parent_id: ctx3Id,
    year: 2022,
    month: 5,
    visibility: "main",
    event_type: "event",
    description: dast(
      "La CLI storica in Ruby viene sostituita da una nuova CLI scritta in TypeScript. Le migration script possono ora essere scritte in TypeScript con type safety completa, autocomplete da shell e gestione dei profili.",
      "Viene introdotto anche il flag --autogenerate per la generazione automatica di migration script: la CLI rileva le differenze di schema tra gli ambienti e genera automaticamente il codice necessario per allinearli."
    ),
  });

  await createNode({
    title: "Cache Tags — invalidazione CDN chirurgica",
    slug: "datocms-cache-tags-2024",
    parent_id: ctx3Id,
    year: 2024,
    month: 7,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Vengono lanciati i Cache Tags: ogni risposta dell'API GraphQL include header con tag che identificano esattamente quale contenuto è stato letto. Quando un contenuto cambia, solo le pagine che lo mostrano vengono rigenerate.",
      "Il meccanismo elimina il compromesso tra cache aggressiva e dati freschi: i siti possono applicare TTL elevati (anche ore o giorni) senza rischiare contenuti obsoleti. Supporto nativo per Next.js con useUnstableCache."
    ),
  });

  // ── SUB-CONTESTO 4: Enterprise & Crescita ────────────────────────────────
  console.log("\n🟢 Sub-contesto 4: Enterprise & Crescita");

  const ctx4Id = await createNode({
    title: "Enterprise & Crescita",
    slug: "datocms-enterprise",
    parent_id: rootId,
    color: hex("#16A34A"),
    year: 2019,
    end_year: 2024,
    concluded: true,
    visibility: "super",
    event_type: "event",
    description: dast(
      "Dal 2019 DatoCMS sviluppa un piano Enterprise solido, introducendo funzionalità per team grandi, processi di approvazione complessi e requisiti di sicurezza avanzati.",
      "La crescita è costante e organica: da €2.17M di ARR nel 2021 a €6M nel 2024, sempre senza investitori esterni. Il traguardo della certificazione ISO 27001 nel 2024 apre le porte ai clienti enterprise con i requisiti di compliance più stringenti."
    ),
  });

  await createNode({
    title: "SSO Okta — primo accesso enterprise SAML",
    slug: "datocms-sso-okta-2019",
    parent_id: ctx4Id,
    year: 2019,
    month: 11,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Viene rilasciata l'integrazione SSO con Okta tramite SAML. Le aziende enterprise possono autenticare i propri collaboratori su DatoCMS usando il provider di identità aziendale esistente.",
      "Seguiranno nel 2020 le integrazioni con Google SSO e Azure SSO, completando il quadro delle principali soluzioni di identity management enterprise."
    ),
  });

  await createNode({
    title: "Sandbox Environments e migration scripts GA",
    slug: "datocms-sandbox-environments-2020",
    parent_id: ctx4Id,
    year: 2020,
    month: 8,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "I Sandbox Environments diventano disponibili in generale: ogni progetto può avere ambienti isolati per sviluppo, staging e produzione. Le modifiche allo schema vengono testate in sandbox prima di essere promosse all'ambiente primario.",
      "Il comando 'dato migrate' permette di scriptare le modifiche allo schema in TypeScript e applicarle in modo riproducibile. È il sistema di deployment del CMS più avanzato disponibile su piattaforma headless, ispirato ai workflow git-based."
    ),
  });

  await createNode({
    title: "Workflows — ciclo di vita editoriale multi-stage",
    slug: "datocms-workflows-2021",
    parent_id: ctx4Id,
    year: 2021,
    month: 6,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Vengono introdotti i Workflows: una macchina a stati configurabile per il ciclo di vita dei contenuti. I team possono definire stadi personalizzati (es. Bozza → In revisione → Approvato → Pubblicato) con permessi per ruolo a ogni stage.",
      "Le operazioni bulk permettono di spostare interi batch di record tra stage. I Workflows risolvono il problema delle organizzazioni con processi editoriali complessi: redattori, editor, legal, brand — ognuno con il proprio controllo."
    ),
  });

  await createNode({
    title: "ARR €3.3M — crescita +71% anno su anno",
    slug: "datocms-arr-2022",
    parent_id: ctx4Id,
    year: 2022,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "DatoCMS chiude il 2022 con €3.3M di ARR, in crescita del 71% rispetto all'anno precedente. Vengono acquisiti 460 nuovi clienti paganti di cui 25 a livello enterprise. 65 agenzie si uniscono al Partner Program.",
      "Il team cresce da 6 a 8 persone. Viene lanciato un Agency Partner Program strutturato, che diventerà uno dei principali canali di crescita dell'azienda negli anni successivi."
    ),
  });

  await createNode({
    title: "Certificazione ISO 27001",
    slug: "datocms-iso-27001-2024",
    parent_id: ctx4Id,
    year: 2024,
    month: 11,
    visibility: "main",
    event_type: "event",
    description: dast(
      "DatoCMS ottiene ufficialmente la certificazione ISO/IEC 27001:2022, lo standard internazionale per i sistemi di gestione della sicurezza delle informazioni. È un traguardo fondamentale per l'adozione enterprise.",
      "La certificazione, sommata alla migrazione infrastrutturale su AWS Kubernetes completata nel 2025, porta la piattaforma a soddisfare i requisiti di compliance più stringenti di grandi organizzazioni e aziende regolamentate."
    ),
  });

  // ── SUB-CONTESTO 5: AI & Innovazione ─────────────────────────────────────
  console.log("\n🔴 Sub-contesto 5: AI & Innovazione");

  const ctx5Id = await createNode({
    title: "AI & Innovazione",
    slug: "datocms-ai-innovazione",
    parent_id: rootId,
    color: hex("#DC2626"),
    year: 2023,
    concluded: false,
    visibility: "super",
    event_type: "event",
    description: dast(
      "Dal 2023 DatoCMS abbraccia l'intelligenza artificiale come componente nativa della piattaforma, non come aggiunta superficiale. Le traduzioni AI, il MCP Server e il Visual Editing rappresentano la visione del CMS come infrastruttura intelligente.",
      "Con il MCP Server del 2025, DatoCMS diventa il primo headless CMS ad offrire un'integrazione nativa con gli agenti AI come Claude Code, Cursor e GitHub Copilot, abilitando la gestione dei contenuti via linguaggio naturale."
    ),
  });

  await createNode({
    title: "Astro SDK e migrazione del sito datocms.com in Astro",
    slug: "datocms-astro-sdk-2024",
    parent_id: ctx5Id,
    year: 2024,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Viene rilasciato l'SDK ufficiale @datocms/astro. Nello stesso anno, il sito datocms.com stesso viene migrato da Next.js ad Astro, diventando una showcase concreta delle performance raggiungibili con il nuovo stack.",
      "La migrazione del sito aziendale è anche un segnale strategico: DatoCMS vuole essere framework-agnostic e dimostrare con i fatti che supporta alla pari tutti i framework moderni."
    ),
  });

  await createNode({
    title: "MCP Server — DatoCMS per agenti AI",
    slug: "datocms-mcp-server-2025",
    parent_id: ctx5Id,
    year: 2025,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Viene rilasciato il DatoCMS MCP Server (Model Context Protocol), che permette ad agenti AI come Claude Code, Cursor, VS Code e Windsurf di interagire con DatoCMS tramite linguaggio naturale: creare contenuti, modificare schemi, gestire upload, eseguire query.",
      "Il MCP Server espone 10 tool specializzati per operazioni guidate da LLM. DatoCMS diventa il primo headless CMS ad offrire un'integrazione nativa con il protocollo standard per gli agenti AI, aprendo scenari completamente nuovi per la gestione dei contenuti."
    ),
  });

  await createNode({
    title: "AI Translations con OpenAI, Claude, Gemini, DeepL",
    slug: "datocms-ai-translations-2025",
    parent_id: ctx5Id,
    year: 2025,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Viene lanciato il plugin AI Translations: gli editor possono tradurre in bulk i contenuti verso qualsiasi lingua usando OpenAI (ChatGPT), Anthropic Claude, Google Gemini o DeepL, direttamente dall'interfaccia del CMS.",
      "La traduzione non è un processo a parte: avviene inline, campo per campo, con possibilità di revisione prima della pubblicazione. Per team che gestiscono contenuti in decine di lingue, il risparmio in tempo è ordini di grandezza."
    ),
  });

  await createNode({
    title: "Migrazione infrastruttura da Heroku ad AWS Kubernetes",
    slug: "datocms-aws-kubernetes-2025",
    parent_id: ctx5Id,
    year: 2025,
    month: 6,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Il 7 giugno 2025 viene completata la migrazione dell'intera infrastruttura di DatoCMS da Heroku a un cluster AWS Kubernetes gestito internamente. La latenza API si riduce del 50% dopo la migrazione.",
      "La nuova infrastruttura garantisce maggiore controllo, scalabilità dinamica e riduzione dei costi operativi. Le richieste API mensili raggiungono 3.5 miliardi, con una crescita del 75% in due anni."
    ),
  });

  await createNode({
    title: "Visual Editing GA — modifica visuale in-CMS",
    slug: "datocms-visual-editing-2026",
    parent_id: ctx5Id,
    year: 2026,
    month: 2,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Il 10 febbraio 2026 il Visual Editing diventa Generally Available. La funzionalità offre due modalità: Click-to-edit via Content Link (click su qualsiasi elemento del sito apre direttamente il campo nel CMS) e Visual Mode (anteprima side-by-side dentro il CMS con editing in tempo reale).",
      "Framework-agnostic, con SDK per Next.js, Nuxt, SvelteKit e Astro, il Visual Editing colma il gap tra CMS headless e CMS visuale tradizionale. Product Hunt: 177 upvotes nel giorno del lancio."
    ),
  });

  console.log("\n✅ Seed completato! 1 contesto radice, 5 sub-contesti, 25 eventi.");
}

main().catch(e => {
  console.error("Errore:", e);
  process.exit(1);
});
