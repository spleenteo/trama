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
  console.log("\n🥋 KARATE");
  const imgHanashiro = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/b/b3/Hanashiro_Chomo.jpg",
    "Hanashiro Chomo"
  );

  const rootId = await createNode({
    title: "Karate",
    slug: "karate",
    color: hex("#475569"),
    year: 1392,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgHanashiro),
    description: dast(
      "Il karate e un'arte marziale nata a Okinawa dall'incontro tra le tradizioni di combattimento indigene dell'isola e le tecniche del kung fu della Cina meridionale. Il nome significa letteralmente 'mano vuota': un sistema di combattimento che non richiede armi, ma trasforma il corpo in uno strumento di difesa e di crescita spirituale.",
      "Dalle radici segrete del Te okinawense, passando per il genio codificatore di Gichin Funakoshi, fino ai tatami olimpici di Tokyo 2020: la storia del karate attraversa sette secoli di culture, invasioni, filosofia buddhista e sport moderno."
    ),
  });

  // ── ORIGINI — CINA E OKINAWA ──────────────────────────────────────────────
  console.log("\n🏯 ORIGINI — CINA E OKINAWA");
  const imgShuri = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Karate_ShuriCastle.jpg",
    "Castello di Shuri, Okinawa"
  );

  const originiId = await createNode({
    title: "Origini — Cina e Okinawa",
    slug: "karate-origini-cina-okinawa",
    parent_id: rootId,
    color: hex("#B45309"),
    year: 500,
    end_year: 1850,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgShuri),
    description: dast(
      "La storia del karate inizia nell'incontro tra due mondi: le tecniche di combattimento a mani nude del sud della Cina — in particolare il kung fu della provincia del Fujian — e il Te, l'arte marziale indigena dell'isola di Okinawa. Questo incontro fu favorito dai legami commerciali e culturali tra il regno di Ryukyu e la Cina imperiale.",
      "Per secoli queste tecniche furono tramandate in segreto, spesso di notte, in risposta ai ripetuti bandi sulle armi imposti prima dal re Sho Shin e poi dagli invasori giapponesi del clan Satsuma. Fu proprio la clandestinita a plasmare il karate: un'arte della sopravvivenza affinata nell'ombra."
    ),
  });

  await createNode({
    title: "Bodhidharma al Tempio Shaolin",
    slug: "bodhidharma-tempio-shaolin",
    parent_id: originiId,
    year: 527,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Intorno al 527 d.C. il monaco buddista indiano Bodhidharma, noto in Cina come Damo, giunge al monastero di Shaolin nello Henan. Trovando i monaci fisicamente debilitati dall'intensa pratica meditativa, insegna loro una serie di esercizi fisici tratti dalle arti marziali indiane.",
      "Questi insegnamenti diventeranno la base del kung fu shaolino, da cui si svilupperanno le arti marziali del Fujian meridionale che influenzeranno direttamente la nascita del karate a Okinawa. La tradizione di Shaolin e il filo che unisce l'India, la Cina e Okinawa."
    ),
  });

  await createNode({
    title: "Le 36 famiglie cinesi arrivano a Okinawa",
    slug: "trentasei-famiglie-cinesi-okinawa",
    parent_id: originiId,
    year: 1392,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Nel 1392 il re Satto del regno di Ryukyu accoglie trentasei famiglie dalla provincia cinese del Fujian, che si stabiliscono nel villaggio di Kume vicino a Naha. Questi immigrati portano conoscenze di navigazione, artigianato e — fondamentale per la storia del karate — le tecniche di combattimento del kempo cinese.",
      "L'incontro tra il kempo del Fujian e il Te indigeno di Okinawa da vita al Tode, letteralmente 'mano cinese', diretto predecessore del karate moderno. Le tradizioni delle 36 famiglie restano vive nell'isola per generazioni, tramandate in forma segreta attraverso lineage familiari."
    ),
  });

  await createNode({
    title: "Il bando delle armi — Re Sho Shin",
    slug: "bando-armi-re-sho-shin",
    parent_id: originiId,
    year: 1477,
    visibility: "main",
    event_type: "incident",
    description: dast(
      "Nel 1477 il re Sho Shin emana un editto che proibisce il porto d'armi a tutta la nobilta. Il provvedimento, motivato dalla volonta di centralizzare il potere, ha l'effetto paradossale di spingere la pratica del combattimento a mani nude verso la clandestinita.",
      "Il bando trasforma il Te in un'arte segreta praticata di notte lontano da occhi indiscreti. La necessita di combattere disarmati diventa la ragione stessa dell'esistenza del karate: il corpo come unica arma."
    ),
  });

  await createNode({
    title: "L'invasione Satsuma e il Te segreto",
    slug: "invasione-satsuma-te-segreto",
    parent_id: originiId,
    year: 1609,
    visibility: "super",
    event_type: "incident",
    description: dast(
      "Nel 1609 il clan Satsuma dell'isola di Kyushu invade il regno di Ryukyu. Un nuovo bando sulle armi ancora piu rigido viene imposto alla popolazione okinawense, che non puo opporre resistenza militare armata.",
      "La risposta culturale e la sopravvivenza e il perfezionamento del Te come arte marziale a mani nude. Paradossalmente, questa oppressione produce i grandi maestri delle tradizioni di Shuri, Naha e Tomari che daranno forma al karate classico."
    ),
  });

  await createNode({
    title: "Le tre scuole di Te: Shuri-te, Naha-te, Tomari-te",
    slug: "tre-scuole-te-okinawa",
    parent_id: originiId,
    year: 1750,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Nel corso del XVIII secolo il Te si cristallizza in tre distinte tradizioni regionali: Shuri-te, praticato nella capitale del regno; Naha-te, sviluppato nel porto commerciale di Naha con forte influenza cinese; Tomari-te, tradizione del villaggio di Tomari con caratteristiche ibride.",
      "Dallo Shuri-te nasceranno Shorin-ryu e Shotokan; dal Naha-te, con la sua pronunciata influenza cinese, nasceranno Shorei-ryu e Goju-ryu. Le tre tradizioni sono i pilastri dell'intero edificio del karate contemporaneo."
    ),
  });

  // ── GICHIN FUNAKOSHI ──────────────────────────────────────────────────────
  console.log("\n🎌 GICHIN FUNAKOSHI");
  const imgFunakoshi = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/EVD-kumite-002.jpg",
    "Gichin Funakoshi"
  );

  const funakoshiId = await createNode({
    title: "Gichin Funakoshi",
    slug: "gichin-funakoshi",
    parent_id: rootId,
    color: hex("#7C3AED"),
    year: 1868,
    end_year: 1957,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgFunakoshi),
    description: dast(
      "Gichin Funakoshi (1868-1957) e il padre del karate moderno. Nato a Shuri da una famiglia di samurai decaduti, inizia a praticare il Te da adolescente sotto i due piu grandi maestri di Okinawa: Yasutsune Azato e Anko Itosu. La sua vita e un atto di devozione totale all'arte marziale e alla sua trasmissione.",
      "Nel 1922 porta il karate da Okinawa al Giappone continentale, trasformandolo da tradizione segreta insulare a disciplina marziale nazionale e poi mondiale. A lui si deve la filosofia del karate-do come via spirituale, il sistema delle cinture colorate e il nome stesso con cui il mondo conosce quest'arte."
    ),
  });

  await createNode({
    title: "Nascita a Okinawa — allievo di Azato e Itosu",
    slug: "funakoshi-nascita-allievo-azato-itosu",
    parent_id: funakoshiId,
    year: 1868,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgFunakoshi),
    description: dast(
      "Gichin Funakoshi nasce il 10 novembre 1868 a Yamakawa, Shuri, Okinawa, da una famiglia di discendenza samurai. Adolescente gracile, inizia la pratica del Te sotto la guida di Yasutsune Azato — uno dei piu grandi maestri dell'isola — e poi di Anko Itosu, il riformatore che sistematizzera le kata per le scuole pubbliche.",
      "Funakoshi studia entrambe le tradizioni principali: lo Shorin-ryu (derivato dallo Shuri-te) e lo Shorei-ryu (derivato dal Naha-te). Questo doppio percorso gli dara una visione integrale del karate. Per trent'anni pratica in segreto insegnando e scrivendo di poesia sotto lo pseudonimo Shoto — 'onde di pino'."
    ),
  });

  await createNode({
    title: "Il karate entra nelle scuole pubbliche di Okinawa",
    slug: "karate-scuole-pubbliche-okinawa-1905",
    parent_id: funakoshiId,
    year: 1905,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Nel 1905, su iniziativa di Anko Itosu, il karate viene introdotto nel curriculum delle scuole pubbliche di Okinawa. Funakoshi, che insegna alle scuole elementari, e tra i protagonisti di questa svolta: per la prima volta l'arte viene insegnata sistematicamente a bambini e ragazzi.",
      "Itosu semplifica e codifica le kata per l'insegnamento di massa, ponendo le basi culturali che permetteranno a Funakoshi di portare il karate in Giappone diciassette anni dopo."
    ),
  });

  await createNode({
    title: "Prima dimostrazione al Ministero dell'Educazione, Tokyo",
    slug: "funakoshi-dimostrazione-tokyo-1922",
    parent_id: funakoshiId,
    year: 1922,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgFunakoshi),
    description: dast(
      "Nel maggio 1922, a cinquantaquattro anni, Funakoshi viene invitato a Tokyo per la Prima Esposizione di Educazione Fisica del Ministero dell'Istruzione. La sua dimostrazione e una rivelazione per il pubblico giapponese, del tutto ignaro di questa arte okinawense.",
      "Jigoro Kano, fondatore del judo, invita immediatamente Funakoshi al Kodokan per una dimostrazione privata. L'entusiasmo e tale che Funakoshi decide di non tornare a Okinawa: inizia a insegnare al Meiseijuku, seminando il futuro del karate mondiale."
    ),
  });

  await createNode({
    title: "Il cambio del nome: 'mano vuota' (kara-te)",
    slug: "funakoshi-cambio-nome-karate-mano-vuota",
    parent_id: funakoshiId,
    year: 1929,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Tra il 1929 e il 1936 Funakoshi cambia la scrittura ideografica del nome 'karate'. L'originale 'mano cinese' (唐手, tode) diventa 'mano vuota' (空手, karate). Il cambiamento riflette la volonta di rendere l'arte pienamente giapponese e universale.",
      "La meditazione sull'insegnamento buddhista 'la forma e vuoto, il vuoto e forma' guida questa scelta filosofica. Nel 1936 una riunione dei maestri di karate a Okinawa sancisce ufficialmente il nuovo nome."
    ),
  });

  await createNode({
    title: "Fondazione dello Shotokan dojo a Tokyo",
    slug: "shotokan-dojo-fondazione-tokyo-1939",
    parent_id: funakoshiId,
    year: 1939,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Nel 1939 gli allievi di Funakoshi costruiscono a Mejiro, Tokyo, il primo dojo permanente dedicato al suo insegnamento. L'edificio viene battezzato Shotokan — 'la sala di Shoto' — dal nome poetico del maestro: e un omaggio degli studenti al loro sensei.",
      "Lo Shotokan diventa il cuore del karate in Giappone. Sfortuna vuole che il dojo venga distrutto nei bombardamenti del 1945, ma il nome e la tradizione sopravvivono: oggi Shotokan e lo stile di karate piu praticato al mondo."
    ),
  });

  await createNode({
    title: "Fondazione della Japan Karate Association (JKA)",
    slug: "japan-karate-association-jka-1949",
    parent_id: funakoshiId,
    year: 1949,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Nel 1949 gli allievi di Funakoshi fondano la Japan Karate Association (JKA) con il maestro come presidente onorario. L'associazione ottiene il riconoscimento del Ministero dell'Educazione giapponese nel 1957, sedici giorni prima della morte di Funakoshi.",
      "La JKA crea un sistema di insegnamento standardizzato e gare agonistiche riconosciute a livello internazionale. Funakoshi muore il 26 aprile 1957 a 89 anni, lasciando un'arte praticata da milioni di persone in tutto il mondo."
    ),
  });

  // ── LE PRINCIPALI SCUOLE ──────────────────────────────────────────────────
  console.log("\n🏅 LE PRINCIPALI SCUOLE");
  const imgMabuni = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/a/a6/Mabuni_Kenwa.jpg",
    "Kenwa Mabuni"
  );
  const imgUechi = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/1/16/Uechi_kanbun.jpg",
    "Kanbun Uechi"
  );
  const imgOyama = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/6/6f/Masutatsu_Oyama_karate.jpg",
    "Mas Oyama"
  );

  const scuoleId = await createNode({
    title: "Le principali scuole",
    slug: "karate-scuole-principali",
    parent_id: rootId,
    color: hex("#D97706"),
    year: 1924,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgMabuni),
    description: dast(
      "Accanto alle tre grandi scuole approfondite in questa timeline — Shotokan, Shorei-ryu e Goju-ryu — il karate del XX secolo ha prodotto altri sistemi di notevole importanza e diffusione mondiale. Shito-ryu, Wado-ryu, Uechi-ryu e Kyokushinkai rappresentano ciascuno una risposta originale alla domanda fondamentale: cosa significa praticare il karate?",
      "Ognuna porta l'impronta del suo fondatore: la sintesi enciclopedica di Mabuni, la fusione con il jujutsu di Otsuka, il misticismo cinese di Uechi, la durezza fisica assoluta di Oyama. Insieme mostrano la ricchezza di un'arte che non ha mai smesso di evolversi."
    ),
  });

  await createNode({
    title: "Shito-ryu — Kenwa Mabuni fonda la scuola",
    slug: "shito-ryu-kenwa-mabuni-1934",
    parent_id: scuoleId,
    year: 1934,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgMabuni),
    description: dast(
      "Kenwa Mabuni nasce a Shuri nel 1889 e studia sia con Anko Itosu (Shuri-te) che con Higaonna Kanryo (Naha-te), diventando il maestro con il repertorio di kata piu vasto della storia del karate. Il nome Shito-ryu e un omaggio ai suoi due maestri: 'Shi' da Itosu, 'To' da Higaonna.",
      "Nel 1934 Mabuni fonda ufficialmente lo Shito-ryu ad Osaka. La scuola e caratterizzata da oltre sessanta kata — il catalogo piu ricco tra tutti gli stili — e da un approccio equilibrato tra tecniche di potenza e tecniche fluide. E' oggi uno dei quattro stili riconosciuti dalla WKF."
    ),
  });

  await createNode({
    title: "Wado-ryu — Hironori Otsuka registra lo stile",
    slug: "wado-ryu-hironori-otsuka-1938",
    parent_id: scuoleId,
    year: 1938,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Hironori Otsuka nasce nel 1892 ed e un maestro di jujutsu prima di incontrare Funakoshi nel 1922, diventandone uno dei primi allievi a ottenere il grado di cintura nera. La sua profonda formazione nel jujutsu lo porta a sviluppare un approccio unico: il Wado-ryu, 'la via della pace e dell'armonia'.",
      "Nel 1938 Otsuka registra il Wado-ryu presso il Dai Nippon Butoku Kai. La caratteristica distintiva e il tai sabaki — lo spostamento del corpo per neutralizzare gli attacchi invece di bloccarli frontalmente. Il Wado-ryu e considerato il primo stile di karate sviluppato interamente in Giappone."
    ),
  });

  await createNode({
    title: "Uechi-ryu — Kanbun Uechi ufficializza la scuola",
    slug: "uechi-ryu-kanbun-uechi-1940",
    parent_id: scuoleId,
    year: 1940,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgUechi),
    description: dast(
      "Kanbun Uechi nasce a Okinawa nel 1877 e nel 1897 parte per la Cina, dove trascorre tredici anni studiando il Pangainoon con il maestro Zhou Zihe nel Fujian. Tornato in Giappone, riprende l'insegnamento dopo anni di ritiro.",
      "Nel 1940 il sistema viene rinominato Uechi-ryu in suo onore. Lo stile e noto per il condizionamento fisico estremo, i colpi di punta delle dita e la forte influenza degli stili animali del kung fu cinese — tigre, drago e gru. L'Uechi-ryu preserva meglio di qualsiasi altro stile le radici cinesi del karate."
    ),
  });

  await createNode({
    title: "Kyokushinkai — Mas Oyama fonda il Kyokushin",
    slug: "kyokushinkai-mas-oyama-1957",
    parent_id: scuoleId,
    year: 1957,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgOyama),
    description: dast(
      "Masutatsu Oyama nasce in Corea nel 1923 e giunge in Giappone a quindici anni, dove studia karate Shotokan con Gigo Funakoshi e poi il Goju-ryu. Nel 1948 si ritira per diciotto mesi su un monte in isolamento totale. La sua pratica di abbattere tori con un colpo di karate diventa leggendaria.",
      "Nel 1957 Oyama battezza il suo sistema Kyokushinkai — 'la societa della verita ultima' — e nel 1964 fonda l'International Karate Organization. Il Kyokushin e noto per il kumite a contatto pieno: niente protezioni, niente colpi alle mani alla testa, ma calci alla testa permessi. Conta oggi oltre 12 milioni di praticanti in 125 paesi."
    ),
  });

  // ── SHOTOKAN ──────────────────────────────────────────────────────────────
  console.log("\n🔵 SHOTOKAN");

  const shotokanId = await createNode({
    title: "Shotokan",
    slug: "shotokan",
    parent_id: rootId,
    color: hex("#1565C0"),
    year: 1922,
    visibility: "super",
    event_type: "event",
    description: dast(
      "Lo Shotokan e lo stile di karate piu diffuso al mondo, praticato da decine di milioni di persone in oltre 190 paesi. Fondato da Gichin Funakoshi a partire dal 1922, prende il nome dal dojo costruito dai suoi allievi a Tokyo nel 1939.",
      "Lo Shotokan e caratterizzato da posizioni basse e stabili, movimenti lineari di grande potenza e un approccio filosofico che vede nel karate una via di formazione del carattere. I venti principi (Niju Kun) di Funakoshi sono ancora oggi la bussola etica dello stile."
    ),
  });

  await createNode({
    title: "Funakoshi a Tokyo — le prime lezioni allo Meiseijuku",
    slug: "shotokan-funakoshi-tokyo-meiseijuku-1922",
    parent_id: shotokanId,
    year: 1922,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Dopo il successo della dimostrazione al Ministero nel 1922, Funakoshi inizia a insegnare a Tokyo al Meiseijuku, dormitorio per studenti okinawensi. Le lezioni attirano rapidamente appassionati di arti marziali e studenti universitari.",
      "Funakoshi adatta lo stile alle caratteristiche fisiche e culturali giapponesi, enfatizzando la dimensione filosofica. In pochi anni apre dojo nelle principali universita di Tokyo, creando la prima generazione di praticanti nipponici."
    ),
  });

  await createNode({
    title: "Prime cinture nere — il sistema dan nel karate",
    slug: "shotokan-prime-cinture-nere-sistema-dan-1924",
    parent_id: shotokanId,
    year: 1924,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Il 10 aprile 1924 Funakoshi assegna le prime certificazioni di grado dan nel karate, mutuando il sistema inventato da Jigoro Kano per il judo. Tra i primi a ricevere il grado di shodan vi e Hironori Otsuka, futuro fondatore del Wado-ryu.",
      "L'introduzione del sistema dan trasforma il karate in una disciplina con un percorso formativo strutturato e misurabile. E' uno dei contributi piu duraturi di Funakoshi alla modernizzazione della disciplina."
    ),
  });

  await createNode({
    title: "Il dojo Shotokan — costruzione a Mejiro",
    slug: "shotokan-dojo-costruzione-mejiro-1939",
    parent_id: shotokanId,
    year: 1939,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Nel 1939 gli allievi di Funakoshi costruiscono a proprie spese un dojo permanente a Mejiro, Tokyo. L'edificio viene chiamato Shotokan in onore del maestro. E' il primo dojo dedicato esclusivamente al karate di Funakoshi.",
      "Qui vengono formalizzati i kata dello Shotokan: Funakoshi seleziona e codifica quindici kata fondamentali che formano il cuore tecnico dello stile. Il dojo diventa il centro della comunita karate del Giappone fino alla sua distruzione nel 1945."
    ),
  });

  await createNode({
    title: "Distruzione del dojo nei bombardamenti di Tokyo",
    slug: "shotokan-distruzione-dojo-1945",
    parent_id: shotokanId,
    year: 1945,
    visibility: "main",
    event_type: "incident",
    description: dast(
      "Nella notte del 9 e 10 marzo 1945 i bombardieri americani B-29 distruggono il dojo Shotokan a Mejiro. Funakoshi perde anche il figlio Yoshitaka — suo successore designato e innovatore tecnico dello stile — che muore di tubercolosi nello stesso anno.",
      "La perdita e devastante, ma il karate sopravvive: decine di allievi sono sparsi per il Giappone. Il vecchio maestro, settantasettenne, ricomincia a insegnare tra le macerie con la stessa determinazione di sempre."
    ),
  });

  await createNode({
    title: "Masatoshi Nakayama e l'espansione internazionale JKA",
    slug: "shotokan-nakayama-espansione-internazionale-1955",
    parent_id: shotokanId,
    year: 1955,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Dal 1955 Masatoshi Nakayama, capo istruttore della JKA, lancia il programma 'Instructor Abroad' che invia maestri di Shotokan in tutto il mondo. Hirokazu Kanazawa va in Gran Bretagna, Taiji Kase in Francia, Keinosuke Enoeda a Liverpool.",
      "Nakayama standardizza il sistema di insegnamento JKA e organizza i primi campionati nazionali di karate nel 1957. Il suo manuale 'Dynamic Karate' (1966), tradotto in decine di lingue, diventa il testo di riferimento mondiale dello Shotokan."
    ),
  });

  // ── SHOREI-RYU ────────────────────────────────────────────────────────────
  console.log("\n🌿 SHOREI-RYU");

  const shoreiId = await createNode({
    title: "Shorei-ryu",
    slug: "shorei-ryu",
    parent_id: rootId,
    color: hex("#16A34A"),
    year: 1853,
    visibility: "super",
    event_type: "event",
    description: dast(
      "Lo Shorei-ryu — 'stile dell'ispirazione' — e una delle radici piu antiche del karate di Okinawa, sviluppata dalla tradizione del Naha-te con forte influenza del kung fu del Fujian meridionale, in particolare dello stile della Gru Bianca. Il suo fondatore e Higaonna Kanryo (1853-1916), che dopo un decennio di studio in Cina porto a Okinawa tecniche di straordinaria raffinatezza.",
      "Lo Shorei-ryu e il progenitore diretto di due scuole moderne: il Goju-ryu, fondato dal principale allievo di Higaonna, Chojun Miyagi, e il Ryuei-ryu. La sua filosofia di equilibrio tra durezza e morbidezza — sintetizzata nel testo classico del Bubishi — rimane una delle idee piu profonde dell'intera tradizione marziale di Okinawa."
    ),
  });

  await createNode({
    title: "Higaonna Kanryo — il fondatore della Naha-te",
    slug: "higaonna-kanryo-fondatore-naha-te",
    parent_id: shoreiId,
    year: 1853,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Higaonna Kanryo nasce il 10 marzo 1853 a Nishimura, nel distretto di Naha. Da giovane studia il Te con Aragaki Seisho, che riconosce il suo talento e lo incoraggia a cercare un insegnante piu avanzato.",
      "Era noto nell'isola come 'Ashi no Higaonna' — 'Higaonna delle gambe' — per la straordinaria potenza dei suoi calci. La sua figura mite ma di forza leggendaria divento il modello del karate-ka come guerriero silenzioso: poche parole, tecnica impeccabile."
    ),
  });

  await createNode({
    title: "Il viaggio in Cina — il Fujian White Crane Kung Fu",
    slug: "higaonna-viaggio-cina-fujian-1875",
    parent_id: shoreiId,
    year: 1875,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Intorno al 1875 Higaonna Kanryo parte per Fuzhou, capoluogo del Fujian in Cina, dove studia per circa tredici anni il kung fu con il maestro Ryu Ryu Ko. La scuola e il Baihequan, lo stile della Gru Bianca, noto per la combinazione di attacchi potenti e movimenti circolari fluidi.",
      "Le kata che porta con se al ritorno a Okinawa — tra cui Sanchin, Seipai, Kururunfa — sono ancora oggi il cuore del repertorio tecnico del Goju-ryu. Il suo ritorno a Naha attira allievi da tutta l'isola, tra cui un ragazzo di quattordici anni di nome Chojun Miyagi."
    ),
  });

  await createNode({
    title: "Il Bubishi — il testo sacro del karate",
    slug: "bubishi-testo-sacro-karate",
    parent_id: shoreiId,
    year: 1890,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Il Bubishi e un manoscritto cinese sull'arte del combattimento, la medicina tradizionale e la filosofia marziale, trasmesso in forma segreta da maestro ad allievo nella tradizione del Naha-te. Il documento contiene teoria dei punti vitali, tecniche di combattimento, piante medicinali e riflessioni filosofiche.",
      "Il principio che ispira il nome Goju-ryu — 'il metodo di inalare e esalare e durezza e morbidezza' — proviene direttamente dal Bubishi. Lo studioso Patrick McCarthy lo ha definito 'la Bibbia del karate'. Sopravvivono oggi copie manoscritte conservate da diverse lignee di maestri."
    ),
  });

  await createNode({
    title: "Shorei-ryu come radice di Goju-ryu e Ryuei-ryu",
    slug: "shorei-ryu-radice-goju-ryu-ryuei-ryu",
    parent_id: shoreiId,
    year: 1915,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Alla morte di Higaonna nel 1915, la sua tradizione si divide nei due rami che definiranno il Naha-te del XX secolo. Il suo allievo piu importante, Chojun Miyagi, sviluppa la tradizione nel Goju-ryu. Un altro allievo, Kenri Nakaima, preserva una linea separata che diventa il Ryuei-ryu.",
      "Lo Shorei-ryu rappresenta il punto di convergenza tra la tradizione okinawense del Naha-te e le radici cinesi del kung fu del Fujian. La sua eredita continua a vivere in ogni dojo dove si pratica Sanchin — con il suo respiro udibile, le tensioni isometriche e la concentrazione assoluta."
    ),
  });

  // ── GOJU-RYU ──────────────────────────────────────────────────────────────
  console.log("\n🔴 GOJU-RYU");

  const gojuId = await createNode({
    title: "Goju-ryu",
    slug: "goju-ryu",
    parent_id: rootId,
    color: hex("#DC2626"),
    year: 1888,
    visibility: "super",
    event_type: "event",
    description: dast(
      "Il Goju-ryu — 'stile duro e morbido' — e uno dei quattro stili di karate riconosciuti dalla World Karate Federation e una delle tradizioni piu antiche del karate di Okinawa. Fondato da Chojun Miyagi (1888-1953), allievo diretto di Higaonna Kanryo, e caratterizzato dall'alternanza di tecniche forti e lineari (go) con tecniche circolari e cedenti (ju).",
      "La filosofia del Goju-ryu e sintetizzata nell'insegnamento 'il respiro e durezza e morbidezza'. Il kata Sanchin, con il suo respiro profondo e le tensioni isometriche, e la pratica meditativa fondamentale dello stile. Il Goju-ryu ha dato origine a numerose scuole derivate, tra cui il Kyokushinkai."
    ),
  });

  await createNode({
    title: "Chojun Miyagi — allievo di Higaonna",
    slug: "chojun-miyagi-allievo-higaonna-1902",
    parent_id: gojuId,
    year: 1902,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Nel 1902, a quattordici anni, Chojun Miyagi viene presentato a Higaonna Kanryo. Nato nel 1888 da una famiglia benestante di Naha, Miyagi e un adolescente vivace: la durissima disciplina di Higaonna lo trasforma in uno studente di straordinaria dedizione.",
      "Per undici anni, fino alla morte del maestro nel 1915, Miyagi segue Higaonna apprendendo ogni sfumatura tecnica e filosofica del Naha-te. Viaggia poi due volte in Cina per approfondire le radici del sistema. A trent'anni e gia considerato il maestro piu tecnico di Okinawa."
    ),
  });

  await createNode({
    title: "Il nome Goju-ryu — dal poema Hakku Kenpo",
    slug: "goju-ryu-nome-hakku-kenpo-1929",
    parent_id: gojuId,
    year: 1929,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Nel 1929 Miyagi partecipa a Kyoto alla prima dimostrazione di karate in Giappone continentale. Alla richiesta di indicare il nome del suo sistema, risponde con una frase del Bubishi: 'Ho wa Goju wa Donto su' — 'il metodo di inalare e esalare e durezza e morbidezza'.",
      "Da quella frase nasce il nome Goju-ryu. La scelta rispecchia la filosofia centrale dello stile: l'alternanza tra forza e cedevolezza, tra tensione e rilascio. E' una delle definizioni piu poetiche nell'intera storia delle arti marziali."
    ),
  });

  await createNode({
    title: "Riconoscimento ufficiale dal Dai Nippon Butoku Kai",
    slug: "goju-ryu-riconoscimento-dnbk-1933",
    parent_id: gojuId,
    year: 1933,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Nel 1933 il Goju-ryu viene riconosciuto ufficialmente dal Dai Nippon Butoku Kai come budo giapponese, diventando il primo stile di karate a ottenere questo riconoscimento istituzionale in Giappone.",
      "Il riconoscimento arriva grazie alle dimostrazioni che Miyagi tiene in tutto il Giappone dal 1927. La sua capacita di spiegare la filosofia del Goju-ryu in termini di budo giapponese lo rende interlocutore credibile per le istituzioni marziali nipponiche."
    ),
  });

  await createNode({
    title: "Creazione dei kata Gekisai per le scuole",
    slug: "goju-ryu-kata-gekisai-1940",
    parent_id: gojuId,
    year: 1940,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Nel 1940 Miyagi crea due nuovi kata — Gekisai Dai Ichi e Gekisai Dai Ni — progettati per l'insegnamento del karate nelle scuole medie di Okinawa. I kata tradizionali del Goju-ryu erano troppo complessi per i principianti.",
      "I kata Gekisai diventano il punto d'ingresso classico nel Goju-ryu e sono ancora oggi insegnati in tutto il mondo. La loro creazione dimostra la capacita di Miyagi di adattare una tradizione antica alle esigenze del presente senza tradirne lo spirito."
    ),
  });

  await createNode({
    title: "Morte di Miyagi — successione a Eiichi Miyazato",
    slug: "miyagi-morte-successione-miyazato-1953",
    parent_id: gojuId,
    year: 1953,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Chojun Miyagi muore l'8 ottobre 1953 a sessantacinque anni per un attacco cardiaco. Non ha mai designato formalmente un successore, ma la famiglia comunica che aveva indicato Eiichi Miyazato come suo erede spirituale.",
      "Il comitato dei principali allievi, riunito nel febbraio 1954, conferma quasi all'unanimita Eiichi Miyazato come successore ufficiale. Questi mantiene la tradizione nel suo dojo Jundokan a Naha, mentre altri allievi diffondono il Goju-ryu in Giappone e negli Stati Uniti."
    ),
  });

  // ── KARATE SPORTIVO MODERNO ───────────────────────────────────────────────
  console.log("\n🏆 KARATE SPORTIVO MODERNO");
  const imgWKF = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/f/f3/World_Karate_Federation_logo.svg",
    "World Karate Federation"
  );

  const sportivoId = await createNode({
    title: "Karate sportivo moderno",
    slug: "karate-sportivo-moderno",
    parent_id: rootId,
    color: hex("#0891B2"),
    year: 1957,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgWKF),
    description: dast(
      "Il karate sportivo nasce nella seconda meta del Novecento dall'esigenza di misurare le abilita dei praticanti attraverso la competizione regolamentata. I primi campionati nazionali in Giappone risalgono al 1957; i primi mondiali al 1970. Oggi la World Karate Federation governa il karate agonistico con 198 nazioni affiliate.",
      "Le discipline competitive sono due: il Kumite — il combattimento con contatto controllato — e il Kata, la forma codificata eseguita in solitudine. Dopo decenni di candidature olimpiche respinte, il karate ha debuttato a Tokyo 2020. L'esclusione da Parigi 2024 ha pero riaperto il dibattito sul futuro olimpico della disciplina."
    ),
  });

  await createNode({
    title: "Primi Campionati Mondiali di Karate — Tokyo, Nippon Budokan",
    slug: "campionati-mondiali-karate-1970-tokyo",
    parent_id: sportivoId,
    year: 1970,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Nel 1970, al Nippon Budokan di Tokyo, si tengono i primi Campionati Mondiali di Karate organizzati dalla World Union of Karate-Do Organizations (WUKO). E' un evento storico: per la prima volta il karate agonistico si confronta su scala planetaria con atleti da decine di paesi.",
      "I campionati mondiali diventano da questo momento un appuntamento biennale. La competizione accelera l'uniformazione tecnica degli stili ma genera anche divisioni tra chi privilegia il karate tradizionale e chi spinge verso la spettacolarizzazione sportiva."
    ),
  });

  await createNode({
    title: "Fondazione della World Karate Federation (WKF)",
    slug: "world-karate-federation-fondazione-1992",
    parent_id: sportivoId,
    year: 1992,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgWKF),
    description: dast(
      "Il 20 dicembre 1992 viene fondata la World Karate Federation (WKF), che riunisce la grande maggioranza delle federazioni nazionali e ottiene il riconoscimento del CIO come unico ente governativo del karate sportivo mondiale.",
      "Con 198 paesi affiliati, la WKF e oggi una delle piu grandi federazioni sportive internazionali. Governa due discipline: Kumite e Kata. La sua capacita organizzativa e stata determinante per ottenere l'inclusione olimpica nel 2016."
    ),
  });

  await createNode({
    title: "Karate incluso nel programma olimpico di Tokyo 2020",
    slug: "karate-olimpiadi-tokyo-2020-inclusione",
    parent_id: sportivoId,
    year: 2016,
    month: 8,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Il 3 agosto 2016 il Comitato Olimpico Internazionale, riunito a Rio de Janeiro, approva l'inclusione del karate nel programma dei Giochi di Tokyo 2020. E' il coronamento di decenni di sforzi: la disciplina aveva gia sfiorato l'inclusione nel 2005 e nel 2013, venendo ogni volta esclusa.",
      "La proposta era stata avanzata dal Comitato Organizzatore di Tokyo, che aveva incluso il karate tra i cinque sport aggiuntivi specifici per i Giochi giapponesi — un omaggio alla disciplina nel suo paese d'origine."
    ),
  });

  await createNode({
    title: "Debutto olimpico a Tokyo — Kata e Kumite ai Giochi",
    slug: "karate-debutto-olimpico-tokyo-2021",
    parent_id: sportivoId,
    year: 2021,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Dal 5 all'8 agosto 2021, al Nippon Budokan di Tokyo — la stessa arena dei primi campionati mondiali del 1970 — il karate fa il suo debutto olimpico ai Giochi della XXXII Olimpiade. Sono 80 gli atleti in gara, con discipline di Kata e Kumite per uomini e donne.",
      "Nella cornice straniante di spalti vuoti per le restrizioni COVID, il mondo del karate vive un momento atteso per decenni. Tra le gare piu celebrate, l'oro nel kata femminile va alla spagnola Sandra Sanchez, considerata la piu grande kata-ka della storia."
    ),
  });

  await createNode({
    title: "Esclusione da Parigi 2024 — la battaglia olimpica continua",
    slug: "karate-esclusione-parigi-2024",
    parent_id: sportivoId,
    year: 2021,
    visibility: "main",
    event_type: "incident",
    description: dast(
      "Nell'estate del 2021, mentre si svolgono le gare olimpiche di Tokyo, e gia noto che il karate non fara parte del programma di Parigi 2024. La decisione del CIO, motivata dalla sovrapposizione con il taekwondo e dalla frammentazione della governance mondiale, lascia attonita la comunita internazionale.",
      "L'esclusione riapre le ferite tra WKF e le altre organizzazioni di karate e rilancia il dibattito sulla divisione interna alla disciplina. La WKF punta ora ai Giochi di Los Angeles 2028 come prossima opportunita olimpica."
    ),
  });

  console.log("\n✅ Seed completato! 1 nodo radice, 7 sotto-temi, 34 eventi.");
}

main().catch(e => {
  console.error("Errore:", e);
  process.exit(1);
});
