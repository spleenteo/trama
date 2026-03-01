import { buildClient } from "@datocms/cma-client-node";

const client = buildClient({ apiToken: process.env.DATOCMS_API_TOKEN ?? "" });

const CONTEXT_MODEL = "OdF30qLZRyWRfVMi_8lTjg";
const EVENT_MODEL   = "Vg_FXz7USqmlzYQl8sMKVw";

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

async function createCtx(fields: Record<string, unknown>) {
  const item = await client.items.create({ item_type: { type: "item_type", id: CONTEXT_MODEL }, ...fields });
  await client.items.publish(item.id);
  console.log(`  ✓ context: ${fields.title}`);
  return item.id;
}

async function createEv(fields: Record<string, unknown>) {
  const item = await client.items.create({ item_type: { type: "item_type", id: EVENT_MODEL }, ...fields });
  await client.items.publish(item.id);
  console.log(`  ✓ evento: ${fields.title} (${fields.year})`);
}

function img(id: string | null) {
  return id ? { upload_id: id } : null;
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {

  // ── CONTESTO RADICE ───────────────────────────────────────────────────────
  console.log("\n🇮🇹 GIUSEPPE GARIBALDI (contesto radice)");
  const imgGaribaldiRoot = await upload("https://upload.wikimedia.org/wikipedia/commons/7/7b/Garibaldi_%281866%29.jpg", "Giuseppe Garibaldi");

  const rootId = await createCtx({
    title: "Giuseppe Garibaldi",
    slug: "giuseppe-garibaldi",
    color: hex("#7C3AED"),
    soft_start_year: 1807,
    soft_end_year: 1882,
    is_concluded: true,
    featured_image: img(imgGaribaldiRoot),
    description: dast(
      "Giuseppe Garibaldi (Nizza, 4 luglio 1807 — Caprera, 2 giugno 1882) e' stato un generale, politico e patriota italiano, protagonista del Risorgimento e considerato uno dei padri della patria. La sua vita e' una delle piu' straordinarie della storia moderna: marinaio, esule, guerrigliero in Sud America, condottiero delle Camicie Rosse, artefice dell'unificazione italiana.",
      "Questa timeline esplora la sua vita attraverso cinque periodi fondamentali: il contesto dell'Italia pre-unitaria in cui nacque, la giovinezza e formazione, l'esilio in Sud America dove forgio' le sue doti militari, le grandi imprese del Risorgimento culminate nella Spedizione dei Mille, e infine gli ultimi anni nell'Italia unita che aveva contribuito a creare."
    ),
  });

  // ── L'ITALIA PRE-UNITARIA ─────────────────────────────────────────────────
  console.log("\n🗺️  L'ITALIA PRE-UNITARIA");
  const imgViennaMap = await upload("https://upload.wikimedia.org/wikipedia/commons/a/ac/Europe_1815_map_en.png", "Europa 1815 — Congresso di Vienna");
  const imgMazzini   = await upload("https://upload.wikimedia.org/wikipedia/commons/9/98/233344387659986_Mazzini.Joseph.jpg", "Giuseppe Mazzini");

  const ctx1Id = await createCtx({
    title: "L'Italia pre-unitaria",
    slug: "italia-pre-unitaria",
    parent_id: rootId,
    color: hex("#475569"),
    soft_start_year: 1800,
    is_concluded: true,
    featured_image: img(imgViennaMap),
    description: dast(
      "Nei primi decenni dell'Ottocento l'Italia e' un mosaico di stati divisi, dominati dall'Austria e governati da monarchie assolute. Il Congresso di Vienna del 1815 aveva cancellato le speranze di liberta' nate con la Rivoluzione francese, restaurando i vecchi regimi.",
      "In questo clima di repressione nascono le prime societa' segrete — i Carbonari — e si diffonde il pensiero liberale e patriottico. Giuseppe Mazzini fonda nel 1831 la Giovine Italia, dando voce al sogno di una nazione unita e indipendente. E' il terreno in cui cresce la generazione del Risorgimento, tra cui il giovane Garibaldi."
    ),
  });

  await createEv({
    title: "Congresso di Vienna: la restaurazione dell'antico ordine",
    slug: "congresso-di-vienna-1815",
    context: ctx1Id,
    year: 1815,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgViennaMap),
    description: dast(
      "Le grandi potenze europee si riuniscono a Vienna per ridisegnare la carta del continente dopo la caduta di Napoleone. L'Italia viene divisa in otto stati sotto l'influenza austriaca: il Lombardo-Veneto direttamente all'Austria, il Piemonte ai Savoia, il centro ai principi restaurati, il Sud ai Borboni.",
      "La Restaurazione soffoca le aspirazioni liberali e nazionali, ma non le cancella. Il seme del Risorgimento e' gia' piantato."
    ),
  });

  await createEv({
    title: "I moti carbonari: le prime rivolte segrete",
    slug: "moti-carbonari-1820",
    context: ctx1Id,
    year: 1820,
    visibility: "main",
    event_type: "incident",
    description: dast(
      "I Carbonari, societa' segreta di ispirazione liberale, guidano le prime insurrezioni contro i regimi assoluti: i moti del 1820-21 in Napoli e Piemonte e quelli del 1831 in Emilia e Romagna vengono tutti repressi nel sangue dalle truppe austriache.",
      "I fallimenti rafforzano tuttavia la coscienza patriottica e convincono i liberali che serve un'organizzazione piu' efficace e radicata nel popolo."
    ),
  });

  await createEv({
    title: "Mazzini fonda la Giovine Italia",
    slug: "mazzini-giovine-italia-1831",
    context: ctx1Id,
    year: 1831,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgMazzini),
    description: dast(
      "Dall'esilio di Marsiglia, il genovese Giuseppe Mazzini fonda la Giovine Italia: un'associazione segreta con l'obiettivo di creare una Repubblica italiana una, indipendente e libera attraverso l'insurrezione popolare.",
      "Il programma mazziniano diffonde un nuovo patriottismo romantico tra i giovani italiani. E' grazie a Mazzini che il ventiseienne Giuseppe Garibaldi, marinaio di Nizza, abbraccia la causa dell'unita' nazionale e cambia per sempre la propria vita."
    ),
  });

  await createEv({
    title: "Il Quarantotto: le rivoluzioni scuotono l'Europa",
    slug: "quarantotto-1848",
    context: ctx1Id,
    year: 1848,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Il 1848 e' l'anno delle rivoluzioni: in tutta Europa i popoli insorgono contro le monarchie assolute. In Italia si sollevano Milano, Venezia, Roma, Palermo. Carlo Alberto di Savoia concede lo Statuto e dichiara guerra all'Austria.",
      "Per la prima volta il sogno dell'Italia unita sembra a portata di mano. Garibaldi rientra dall'America per combattere: inizia la sua leggenda sul suolo patrio."
    ),
  });

  await createEv({
    title: "La Prima Guerra d'Indipendenza italiana",
    slug: "prima-guerra-indipendenza-1848",
    context: ctx1Id,
    year: 1848,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Il Piemonte di Carlo Alberto dichiara guerra all'Austria nel marzo 1848, sostenuto dall'entusiasmo popolare. Le battaglie di Goito e Pastrengo segnano qualche successo iniziale, ma la sconfitta di Custoza nell'estate e poi di Novara nel 1849 costringono all'armistizio.",
      "La prima guerra si conclude con un fallimento militare, ma segna l'inizio del lungo percorso che portera' all'Unita' d'Italia sotto la guida dei Savoia e di Cavour."
    ),
  });

  // ── GIOVINEZZA E FORMAZIONE ───────────────────────────────────────────────
  console.log("\n⚓ GIOVINEZZA E FORMAZIONE");
  const imgGaribaldi = await upload("https://upload.wikimedia.org/wikipedia/commons/7/7b/Garibaldi_%281866%29.jpg", "Giuseppe Garibaldi");
  const imgNizza     = await upload("https://upload.wikimedia.org/wikipedia/commons/b/ba/Promenade_des_Anglais_Nice_IMG_1255.jpg", "Nizza — Promenade des Anglais");

  const ctx2Id = await createCtx({
    title: "Giovinezza e Formazione",
    slug: "giovinezza-e-formazione",
    parent_id: rootId,
    color: hex("#0891B2"),
    soft_start_year: 1807,
    is_concluded: true,
    featured_image: img(imgGaribaldi),
    description: dast(
      "Giuseppe Garibaldi nasce il 4 luglio 1807 a Nizza, citta' allora francese ma di cultura italiana. Figlio di un marinaio, sin da bambino e' attratto dal mare e dalla navigazione. La sua giovinezza e' quella di un marinaio mediterraneo, lontana dalla politica.",
      "L'incontro con le idee mazziniane trasformera' il semplice marinaio in uno dei piu' grandi condottieri del Risorgimento. Dalla quiete del porto di Nizza alle cospirazioni rivoluzionarie di Genova: e' qui che nasce l'eroe dei due mondi."
    ),
  });

  await createEv({
    title: "Nascita a Nizza: il futuro eroe vede la luce",
    slug: "nascita-garibaldi-1807",
    context: ctx2Id,
    year: 1807,
    month: 7,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgNizza),
    description: dast(
      "Il 4 luglio 1807 nasce a Nizza Giuseppe Garibaldi, terzogenito di Domenico Garibaldi e Rosa Raimondi. La famiglia e' di marinai e commercianti liguri: il padre gestisce un piccolo veliero nel commercio costiero.",
      "Nizza e' allora una citta' culturalmente italiana ma sotto dominio francese, ceduta dalla Savoia nel 1792. Questa doppia identita' segna profondamente Garibaldi, che si sentira' sempre italiano ma crescera' nel Mediterraneo cosmopolita."
    ),
  });

  await createEv({
    title: "Il giovane marinaio: le prime navigazioni nel Mediterraneo",
    slug: "garibaldi-marinaio-1824",
    context: ctx2Id,
    year: 1824,
    visibility: "main",
    event_type: "event",
    description: dast(
      "A diciassette anni Garibaldi ottiene la patente di marinaio e comincia a navigare nel Mediterraneo. Compie viaggi verso la Crimea, il Mar Nero, Costantinopoli e le coste del Levante.",
      "La vita di mare lo tempra fisicamente e lo mette in contatto con popoli e culture diverse. Impara il francese e l'arabo, sviluppa una straordinaria resistenza fisica e un carattere avventuroso che lo accompagnera' per tutta la vita."
    ),
  });

  await createEv({
    title: "L'incontro con Mazzini e la Giovine Italia",
    slug: "garibaldi-mazzini-1833",
    context: ctx2Id,
    year: 1833,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgMazzini),
    description: dast(
      "Durante uno scalo a Genova nel 1833, il ventiseienne Garibaldi incontra per la prima volta le idee di Mazzini e aderisce alla Giovine Italia. L'incontro e' una folgorazione: il marinaro di Nizza abbraccia la causa dell'unita' nazionale con la stessa passione con cui aveva abbracciato il mare.",
      "Da questo momento la sua vita cambia radicalmente. Garibaldi non e' piu' solo un marinaio: e' un patriota pronto a sacrificare tutto per un ideale."
    ),
  });

  await createEv({
    title: "Il tentato colpo di Stato in Piemonte e la condanna a morte",
    slug: "tentato-colpo-stato-1834",
    context: ctx2Id,
    year: 1834,
    visibility: "super",
    event_type: "incident",
    description: dast(
      "Mazzini organizza un'insurrezione in Piemonte per febbraio 1834. Garibaldi, arruolato nella marina piemontese per facilitare il piano, deve sobillare i marinai. Il tentativo fallisce miseramente: i cospiratori vengono arrestati, altri fuggono.",
      "Garibaldi riesce a scappare. Processato in contumacia dal tribunale di Genova, viene condannato a morte per alto tradimento. Ha ventisette anni e la sua vita in Italia e' finita: inizia il lungo esilio."
    ),
  });

  await createEv({
    title: "La fuga e il primo esilio: addio all'Italia",
    slug: "fuga-esilio-1835",
    context: ctx2Id,
    year: 1835,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Braccato dalle autorita' piemontesi, Garibaldi si rifugia prima a Nizza poi in Francia e infine si imbarca per il Sud America. Tocca Tunisi, Rio de Janeiro, e alla fine approda in Brasile nel 1836.",
      "L'esilio e' una condanna ma anche un'opportunita': in Sud America Garibaldi imparera' a fare la guerra, a guidare gli uomini, a vincere contro ogni probabilita'. Tornera' in Italia dieci anni dopo trasformato in un condottiero."
    ),
  });

  // ── L'ESILIO IN SUD AMERICA ───────────────────────────────────────────────
  console.log("\n🌿 L'ESILIO IN SUD AMERICA");
  const imgAnita = await upload("https://upload.wikimedia.org/wikipedia/commons/c/cb/Anita_Garibaldi_-_1839.jpg", "Anita Garibaldi");

  const ctx3Id = await createCtx({
    title: "L'Esilio in Sud America",
    slug: "esilio-in-sud-america",
    parent_id: rootId,
    color: hex("#16A34A"),
    soft_start_year: 1836,
    is_concluded: true,
    featured_image: img(imgAnita),
    description: dast(
      "Per dodici anni, dal 1836 al 1848, Garibaldi vive in Sud America. Combatte per le cause degli oppressi in Brasile e Uruguay, forgia le sue Camicie Rosse — i volontari che lo seguiranno anche in Italia — e incontra Ana Maria de Jesus Ribeiro, la leggendaria Anita, che diventa sua compagna nella vita e nelle battaglie.",
      "L'esilio americano trasforma il cospiratore in un condottiero. Garibaldi impara l'arte della guerra partigiana, la guerriglia, il comando di truppe irregolari. Queste esperienze saranno decisive quando tornera' in Italia a guidare la grande impresa del Risorgimento."
    ),
  });

  await createEv({
    title: "L'arrivo in Brasile e la guerra del Rio Grande do Sul",
    slug: "garibaldi-brasile-1836",
    context: ctx3Id,
    year: 1836,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Giunto a Rio de Janeiro nel 1836, Garibaldi trova lavoro come commerciante e capitano di cabotaggio. Nel 1837 si unisce alla causa della Repubblica di Rio Grande do Sul, una provincia brasiliana in rivolta contro il governo centrale.",
      "Per otto anni combatte nelle pianure e nelle foreste del Sud del Brasile, guidando flottiglie di piccole imbarcazioni sui fiumi e comandando cavalieri nelle savane. E' qui che impara la guerra di movimento e la tattica partigiana che lo rendera' famoso."
    ),
  });

  await createEv({
    title: "L'incontro con Anita Garibaldi a Laguna",
    slug: "garibaldi-anita-1839",
    context: ctx3Id,
    year: 1839,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgAnita),
    description: dast(
      "Nel 1839, durante la campagna di Laguna in Brasile, Garibaldi incontra Ana Maria de Jesus Ribeiro, una giovane donna brasiliana di origine catarinense. La tradizione vuole che Garibaldi la guardi dal ponte della sua nave e dica: 'Tu devi essere mia.'",
      "Anita non e' solo una compagna sentimentale: e' una guerriera. Combatte al fianco di Garibaldi a cavallo, spara, porta in salvo i figli neonati in mezzo alle battaglie. La loro storia d'amore diventa leggenda del Risorgimento."
    ),
  });

  await createEv({
    title: "Uruguay: la difesa di Montevideo e le Camicie Rosse",
    slug: "garibaldi-camicie-rosse-1842",
    context: ctx3Id,
    year: 1842,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgGaribaldi),
    description: dast(
      "Trasferitosi in Uruguay nel 1841, Garibaldi organizza la Legione Italiana per difendere Montevideo assediata dalle truppe di Rosas e Oribe. I volontari italiani indossano camicie rosse riciclate da una fabbrica di salagione: nasce cosi' il simbolo piu' famoso del Risorgimento.",
      "La difesa di Montevideo dura quasi dieci anni e rende Garibaldi famoso in Europa. Alexandre Dumas lo definisce 'eroe dei due mondi'. Quando tornera' in Italia, portara' con se' le Camicie Rosse e il metodo di combattimento imparato in America."
    ),
  });

  await createEv({
    title: "La famiglia in esilio: tra battaglie e affetti",
    slug: "garibaldi-famiglia-1845",
    context: ctx3Id,
    year: 1845,
    visibility: "main",
    event_type: "event",
    featured_image: img(imgAnita),
    description: dast(
      "Tra una battaglia e l'altra, Garibaldi e Anita costruiscono una famiglia. Hanno quattro figli: Menotti (1840), Rosita (1843, morta bambina), Teresita (1845) e Ricciotti (1847). La vita familiare e' nomade e precaria, sempre in balia della guerra.",
      "Anita e' una madre e una guerriera insieme, capace di allattare i figli e impugnare le armi nello stesso giorno. La sua figura incarna l'ideale romantico della donna patriota che sacrifica tutto per la liberta'."
    ),
  });

  await createEv({
    title: "Il ritorno in Italia: la rivoluzione chiama",
    slug: "garibaldi-ritorno-italia-1848",
    context: ctx3Id,
    year: 1848,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgGaribaldi),
    description: dast(
      "Le notizie delle rivoluzioni del 1848 raggiungono Garibaldi in Uruguay. Senza esitare, raduna sessanta volontari delle Camicie Rosse e si imbarca per l'Italia. Approda a Nizza in giugno e si offre al governo piemontese, che lo accetta con diffidenza.",
      "L'eroe dei due mondi torna in patria dopo dodici anni di esilio. Ha quarantuno anni, e' indurito da mille battaglie. La sua avventura piu' grande deve ancora cominciare."
    ),
  });

  // ── IL RISORGIMENTO E I MILLE ──────────────────────────────────────────────
  console.log("\n⚔️  IL RISORGIMENTO E I MILLE");
  const imgPartenzaQuarto   = await upload("https://upload.wikimedia.org/wikipedia/commons/c/c3/Partenza_da_Quarto.jpg", "Partenza da Quarto — Spedizione dei Mille");
  const imgCalatafimi       = await upload("https://upload.wikimedia.org/wikipedia/commons/a/a0/Battle_of_Calatafimi.jpg", "Battaglia di Calatafimi");
  const imgVittorioEmanuele = await upload("https://upload.wikimedia.org/wikipedia/commons/d/dc/VictorEmmanuel2.jpg", "Vittorio Emanuele II");

  const ctx4Id = await createCtx({
    title: "Il Risorgimento e i Mille",
    slug: "risorgimento-e-i-mille",
    parent_id: rootId,
    color: hex("#DC2626"),
    soft_start_year: 1848,
    is_concluded: true,
    featured_image: img(imgPartenzaQuarto),
    description: dast(
      "Dal ritorno in Italia nel 1848 alla proclamazione del Regno d'Italia nel 1861, Garibaldi e' il protagonista militare del Risorgimento. Combatte nella Repubblica Romana del 1849, nella Seconda Guerra d'Indipendenza del 1859, e infine guida la Spedizione dei Mille: l'impresa che conquista il Sud Italia e consegna la penisola ai Savoia.",
      "La Spedizione dei Mille e' uno degli episodi piu' straordinari della storia moderna: mille uomini male armati, partiti da Genova su due piroscafi, in tre mesi conquistano il Regno delle Due Sicilie. Un'impresa che solo un condottiero come Garibaldi poteva concepire e realizzare."
    ),
  });

  await createEv({
    title: "La difesa della Repubblica Romana",
    slug: "garibaldi-repubblica-romana-1849",
    context: ctx4Id,
    year: 1849,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgGaribaldi),
    description: dast(
      "Dopo la sconfitta piemontese del 1848, Garibaldi si sposta a Roma dove e' proclamata la Repubblica Romana nel febbraio 1849. Il papa Pio IX e' in fuga. Garibaldi comanda la difesa della citta' contro le truppe francesi inviate a restaurare il potere pontificio.",
      "Nonostante l'eroica resistenza, la Repubblica cade il 3 luglio 1849. Garibaldi organizza la ritirata verso Venezia con quattromila uomini attraverso l'Italia centrale, inseguito da eserciti nemici su tutti i lati. Anita muore di stenti durante la fuga, a soli ventisette anni. Un dolore che Garibaldi portara' per sempre."
    ),
  });

  await createEv({
    title: "La Seconda Guerra d'Indipendenza",
    slug: "seconda-guerra-indipendenza-1859",
    context: ctx4Id,
    year: 1859,
    visibility: "main",
    event_type: "event",
    featured_image: img(imgGaribaldi),
    description: dast(
      "Nel 1859 il conte Cavour ottiene l'alleanza con la Francia di Napoleone III contro l'Austria. Garibaldi guida i Cacciatori delle Alpi, un corpo di volontari che opera in Lombardia e sul lago di Como, conquistando Varese e Como.",
      "La guerra si conclude con la pace di Zurigo: la Lombardia passa al Piemonte ma il Veneto rimane austriaco. Garibaldi e' furioso per la cessione di Nizza alla Francia come compenso per l'alleanza. La sua citta' natale non sara' mai italiana."
    ),
  });

  await createEv({
    title: "La partenza da Quarto: l'Impresa dei Mille inizia",
    slug: "partenza-da-quarto-1860",
    context: ctx4Id,
    year: 1860,
    month: 5,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgPartenzaQuarto),
    description: dast(
      "Nella notte tra il 5 e il 6 maggio 1860, da Quarto presso Genova salpano due piroscafi con a bordo milleotto volontari — i Mille — comandati da Garibaldi. L'obiettivo e' la conquista del Regno delle Due Sicilie, governato dai Borboni.",
      "E' una delle imprese piu' audaci della storia: un esercito di volontari male equipaggiati che si lancia alla conquista di un regno di otto milioni di abitanti. Cavour e il re Vittorio Emanuele osservano in silenzio, pronti a raccogliere i frutti se l'impresa riesce."
    ),
  });

  await createEv({
    title: "La battaglia di Calatafimi: la prima grande vittoria",
    slug: "battaglia-calatafimi-1860",
    context: ctx4Id,
    year: 1860,
    month: 5,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgCalatafimi),
    description: dast(
      "Il 15 maggio 1860, tre giorni dopo lo sbarco a Marsala, i Mille affrontano l'esercito borbonico sui terrazzamenti di Calatafimi, in Sicilia. I borbonici occupano le alture: la situazione sembra disperata. Garibaldi lancia una carica all'arma bianca urlando 'O qui si fa l'Italia o qui si muore'.",
      "La vittoria di Calatafimi apre la via verso Palermo. In poche settimane tutta la Sicilia cade. L'impresa dei Mille diventa realta': un esercito di volontari sta conquistando un regno."
    ),
  });

  await createEv({
    title: "L'incontro di Teano con Vittorio Emanuele II",
    slug: "incontro-teano-1860",
    context: ctx4Id,
    year: 1860,
    month: 10,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgVittorioEmanuele),
    description: dast(
      "Il 26 ottobre 1860, sulla strada tra Teano e Vairano, Garibaldi incontra Vittorio Emanuele II che scende con il suo esercito dal Nord. Garibaldi saluta il re con le parole: 'Saluto il primo Re d'Italia' e gli consegna il Sud Italia conquistato con il sangue dei suoi volontari.",
      "E' un gesto di straordinaria generosita' politica: Garibaldi rinuncia a qualsiasi ambizione personale e consegna il frutto delle sue conquiste alla monarchia sabauda. Il giorno dopo si ritira nella sua isola di Caprera, con un sacco di sementi e null'altro."
    ),
  });

  // ── L'ITALIA UNITA E GLI ULTIMI ANNI ──────────────────────────────────────
  console.log("\n🏔️  L'ITALIA UNITA E GLI ULTIMI ANNI");
  const imgAspromonte = await upload("https://upload.wikimedia.org/wikipedia/commons/7/76/The_Injured_Garibaldi_in_the_Aspromonte_Mountains_%28oil_on_canvas%29.jpg", "Garibaldi ferito all'Aspromonte");
  const imgMentana    = await upload("https://upload.wikimedia.org/wikipedia/commons/6/65/Lionel-No%C3%ABl_Royer_-_The_Battle_Near_Mentana.jpg", "Battaglia di Mentana");

  const ctx5Id = await createCtx({
    title: "L'Italia Unita e gli Ultimi Anni",
    slug: "italia-unita-e-ultimi-anni",
    parent_id: rootId,
    color: hex("#B45309"),
    soft_start_year: 1861,
    is_concluded: true,
    featured_image: img(imgGaribaldi),
    description: dast(
      "Dopo l'Unita' d'Italia (1861), Garibaldi non smette di combattere. Tenta due volte di liberare Roma — respinto ad Aspromonte nel 1862 e sconfitto a Mentana nel 1867 — e partecipa alla Terza Guerra d'Indipendenza nel 1866.",
      "Gli ultimi anni sono quelli di un vecchio leone nell'isola di Caprera: ferito, malmesso, spesso in polemica con il governo italiano. Ma la sua figura rimane simbolo vivo del Risorgimento. Muore il 2 giugno 1882, lasciando un'Italia unita ma ancora incompiuta."
    ),
  });

  await createEv({
    title: "Aspromonte: ferito e arrestato dal suo stesso esercito",
    slug: "aspromonte-1862",
    context: ctx5Id,
    year: 1862,
    month: 8,
    visibility: "super",
    event_type: "incident",
    featured_image: img(imgAspromonte),
    description: dast(
      "Nell'estate del 1862 Garibaldi sbarca in Calabria con un migliaio di volontari con l'obiettivo di marciare su Roma. Il governo italiano, che teme le reazioni della Francia, gli invia contro l'esercito regolare. Il 29 agosto, sull'Aspromonte, i due eserciti si scontrano.",
      "Garibaldi ordina ai suoi di non sparare. Viene colpito da due proiettili — uno al ginocchio, uno al piede — e cade. Viene arrestato e condotto a prigione al castello di Varignano. L'episodio suscita indignazione in tutta Europa: l'eroe del Risorgimento arrestato dall'Italia che aveva contribuito a creare."
    ),
  });

  await createEv({
    title: "La Terza Guerra d'Indipendenza: Garibaldi combatte ancora",
    slug: "terza-guerra-indipendenza-1866",
    context: ctx5Id,
    year: 1866,
    visibility: "main",
    event_type: "event",
    featured_image: img(imgGaribaldi),
    description: dast(
      "Nel 1866 l'Italia si allea con la Prussia contro l'Austria per conquistare il Veneto. Garibaldi, a sessant'anni, comanda ancora i Cacciatori delle Alpi nel Trentino. Vince la battaglia di Bezzecca il 21 luglio — l'unica vittoria italiana della guerra.",
      "Quando l'armistizio impone la cessione del Trentino all'Austria, Garibaldi risponde con il celebre telegramma: 'Obbedisco'. Due parole che racchiudono la sua tragedia: un uomo che ha vinto le battaglie sul campo ma e' sempre sconfitto dalla politica."
    ),
  });

  await createEv({
    title: "La sconfitta di Mentana: l'ultimo grande scontro",
    slug: "mentana-1867",
    context: ctx5Id,
    year: 1867,
    month: 11,
    visibility: "super",
    event_type: "incident",
    featured_image: img(imgMentana),
    description: dast(
      "Nel 1867 Garibaldi lancia un terzo tentativo su Roma. Con poche migliaia di volontari penetra nel Lazio pontificio, ma il 3 novembre viene sconfitto a Mentana dalle truppe pontificie affiancate dai soldati francesi di Napoleone III, armati dei modernissimi fucili Chassepot.",
      "La sconfitta di Mentana chiude definitivamente l'epoca delle imprese garibaldine. Roma restera' papale ancora tre anni, fino al 20 settembre 1870. Garibaldi non partecipera' alla presa di Porta Pia."
    ),
  });

  await createEv({
    title: "Garibaldi deputato: la politica nell'Italia unita",
    slug: "garibaldi-deputato-1874",
    context: ctx5Id,
    year: 1874,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Negli ultimi anni Garibaldi partecipa alla vita politica italiana come deputato. Siede in Parlamento a Roma — la citta' che aveva tentato tre volte di liberare — e sostiene cause sociali: i diritti dei lavoratori, la bonifica delle paludi pontine, la costruzione di canali.",
      "Le sue proposte sono spesso visionarie e inascoltate. Il vecchio eroe e' diventato scomodo per la classe politica moderata che governa l'Italia. Trascorre sempre piu' tempo a Caprera, a coltivare la terra e a scrivere le sue memorie."
    ),
  });

  await createEv({
    title: "La morte a Caprera: la fine di un'era",
    slug: "morte-caprera-1882",
    context: ctx5Id,
    year: 1882,
    month: 6,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgGaribaldi),
    description: dast(
      "Il 2 giugno 1882 Giuseppe Garibaldi muore nella sua casa di Caprera, circondato dai figli e dalla quarta moglie Francesca Armosino. Ha settantacinque anni. Gli ultimi mesi li ha trascorsi a letto, tormentato dalle ferite di una vita di battaglie.",
      "La notizia della morte provoca il lutto in tutta Italia e in Europa. Garibaldi viene ricordato come simbolo della liberta' dei popoli, dell'eroismo romantico e del sacrificio per un ideale. La sua figura continua ad ispirare generazioni di patrioti in tutto il mondo."
    ),
  });

  console.log("\n✅ Seed completato! 1 contesto radice, 5 sub-contesti, 25 eventi, 12 immagini caricate.");
}

main().catch(e => {
  console.error("Errore:", e);
  process.exit(1);
});
