import { buildClient } from "@datocms/cma-client-node";

const client = buildClient({ apiToken: process.env.DATOCMS_API_TOKEN ?? "" });

const NODE_MODEL = "JbziKHLoTUCdJCdTZwWWlg";

function hex(h: string) {
  return { red: parseInt(h.slice(1, 3), 16), green: parseInt(h.slice(3, 5), 16), blue: parseInt(h.slice(5, 7), 16), alpha: 255 };
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

  // ── NODO RADICE: STORIA ─────────────────────────────────────────────────
  console.log("\n📜 STORIA");

  const storiaId = await createNode({
    title: "Storia",
    slug: "storia",
    color: hex("#475569"),
    year: 1769,
    end_year: 1821,
    visibility: "super",
    event_type: "event",
    description: dast(
      "La grande storia raccontata attraverso le voci dei protagonisti e dei testimoni.",
      "Timeline dedicate ai grandi eventi, personaggi e trasformazioni che hanno plasmato il mondo moderno."
    ),
  });

  // ── NAPOLEONE BONAPARTE ─────────────────────────────────────────────────
  console.log("\n🦅 NAPOLEONE BONAPARTE");
  const imgNapoleon = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/5/50/Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project.jpg",
    "Napoleone Bonaparte — Jacques-Louis David"
  );

  const napoleoneId = await createNode({
    title: "Napoleone Bonaparte",
    slug: "napoleone-bonaparte",
    parent_id: storiaId,
    color: hex("#DC2626"),
    year: 1769,
    end_year: 1821,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgNapoleon),
    description: dast(
      "La parabola di Napoleone Bonaparte, dall'infanzia in Corsica alla morte a Sant'Elena. Un uomo che ha diffuso i valori della Rivoluzione costruendo un impero dispotico.",
      "Come dice Madame de Staël: considerava gli individui come pedine su una scacchiera. Eppure l'Europa moderna è stata in gran parte lui a plasmarla.",
      "Basato sulle conferenze di Alessandro Barbero."
    ),
  });

  // ── 1. LE ORIGINI E LA RIVOLUZIONE (1769–1795) ─────────────────────────
  console.log("\n🏝️ LE ORIGINI E LA RIVOLUZIONE");
  const imgToulon = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/f/f1/Si%C3%A8ge_de_Toulon.PNG",
    "Assedio di Tolone, 1793"
  );

  const originiId = await createNode({
    title: "Le origini e la Rivoluzione",
    slug: "origini-e-rivoluzione",
    parent_id: napoleoneId,
    color: hex("#B45309"),
    year: 1769,
    end_year: 1795,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgToulon),
    description: dast(
      "Napoleone nasce ad Ajaccio in una Corsica appena diventata francese. Famiglia nobile ma povera, padre avvocato che si schiera con la Francia.",
      "Entra alla scuola militare di Brienne, dove è straniero e povero tra i nobili francesi. Esce sottotenente di artiglieria a 16 anni. La svolta arriva a Tolone: a 24 anni è generale."
    ),
  });

  // Eventi origini
  await createNode({
    title: "Nascita di Napoleone ad Ajaccio",
    slug: "nascita-napoleone-ajaccio",
    parent_id: originiId,
    year: 1769,
    month: 8,
    day: 15,
    visibility: "super",
    event_type: "event",
    description: dast(
      "Napoleone nasce ad Ajaccio il 15 agosto 1769 in una Corsica appena ceduta dalla Repubblica di Genova alla Francia. Figlio di Carlo Buonaparte e Letizia Ramolino, una famiglia nobile ma povera.",
      "Quando sarà imperatore obbligherà il Papa a proclamare il 15 agosto festa di San Napoleone."
    ),
  });

  await createNode({
    title: "Scuola militare di Brienne",
    slug: "scuola-militare-brienne",
    parent_id: originiId,
    year: 1779,
    visibility: "regular",
    event_type: "event",
    description: dast(
      "A 10 anni il padre lo porta in Francia alla scuola militare di Brienne. I compagni sono tutti nobili francesi, lui viene da un'isola piccola e povera. È uno straniero.",
      "\"Ero stanco di mostrare la mia povertà, di subire lo scherno di ragazzi che mi erano superiori soltanto per il denaro.\""
    ),
  });

  await createNode({
    title: "Sottotenente di artiglieria a 16 anni",
    slug: "sottotenente-artiglieria",
    parent_id: originiId,
    year: 1785,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Napoleone esce dalla Scuola Militare di Parigi con il grado di sottotenente di artiglieria. Si classifica 42° su 58.",
      "L'artiglieria era l'arma di quelli intelligenti, perché bisognava saper fare i calcoli. Napoleone resterà un artigliere per tutta la vita: le sue vittorie sono state vinte soprattutto grazie a un uso magistrale dei cannoni."
    ),
  });

  await createNode({
    title: "Assedio di Tolone — generale a 24 anni",
    slug: "assedio-tolone-generale",
    parent_id: originiId,
    year: 1793,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgToulon),
    description: dast(
      "Il grande porto di Tolone è occupato dalla flotta inglese. Grazie alla rete corsa, il capitano Bonaparte riceve il comando dell'artiglieria d'assedio. Il suo piano di tiro costringe gli inglesi a evacuare.",
      "Augustin Robespierre scrive al fratello di aver incontrato \"un ufficiale di un talento trascendente\". Da un giorno all'altro lo fanno generale. A 24 anni Bonaparte è generale ed è un favorito del regime giacobino."
    ),
  });

  await createNode({
    title: "Vendemmiaio — mitraglia gli insorti monarchici",
    slug: "vendemmiaio-insorti-monarchici",
    parent_id: originiId,
    year: 1795,
    month: 10,
    day: 5,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "25.000 insorti monarchici marciano contro la Convenzione. Barras si ricorda di Tolone, di qualcuno che sapeva usare bene i cannoni.",
      "Il governo si affida a Napoleone e lui risolve la situazione a modo suo: mitragliando gli insorti. Promosso comandante in capo dell'esercito dell'Interno."
    ),
  });

  // ── 2. L'ASCESA (1796–1804) ────────────────────────────────────────────
  console.log("\n⚔️ L'ASCESA");
  const imgArcole = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/d/dc/La_Bataille_du_Pont_d%27Arcole.jpg",
    "Battaglia del Ponte di Arcole"
  );
  const imgPiramidi = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/2/29/Francois-Louis-Joseph_Watteau_001.jpg",
    "Battaglia delle Piramidi"
  );
  const imgBrumaio = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/4/44/Bouchot_-_Le_general_Bonaparte_au_Conseil_des_Cinq-Cents.jpg",
    "Colpo di stato del 18 Brumaio"
  );
  const imgMarengo = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/f/fe/Lejeune_-_Bataille_de_Marengo.jpg",
    "Battaglia di Marengo"
  );
  const imgCoronation = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Jacques-Louis_David_-_The_Coronation_of_Napoleon_%281805-1807%29.jpg",
    "Incoronazione di Napoleone — Jacques-Louis David"
  );

  const ascesaId = await createNode({
    title: "L'ascesa",
    slug: "ascesa-napoleone",
    parent_id: napoleoneId,
    color: hex("#D97706"),
    year: 1796,
    end_year: 1804,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgArcole),
    description: dast(
      "Dalla campagna d'Italia che lo rende leggenda al colpo di stato del 18 Brumaio, fino all'incoronazione imperiale modellata su Carlo Magno.",
      "\"Se il nostro padre ci vedesse!\" — Napoleone prima dell'incoronazione."
    ),
  });

  await createNode({
    title: "Matrimonio con Giuseppina",
    slug: "matrimonio-giuseppina",
    parent_id: ascesaId,
    year: 1796,
    month: 3,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Dieci giorni dopo le cannonate di Vendemmiaio, Barras presenta al giovane generale la sua ex amante: Joséphine de Beauharnais, vedova di un generale ghigliottinato sotto il Terrore.",
      "Si sposano quattro mesi dopo. Nell'atto di matrimonio Napoleone si aggiunge un anno e Giuseppina se ne toglie quattro."
    ),
  });

  await createNode({
    title: "Campagna d'Italia — nasce la leggenda",
    slug: "campagna-italia-leggenda",
    parent_id: ascesaId,
    year: 1796,
    end_year: 1797,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgArcole),
    description: dast(
      "\"Soldati! Siete nudi e malnutriti. Io vi condurrò nelle più fertili pianure della terra.\" Con la campagna d'Italia nasce per sempre la leggenda di Napoleone.",
      "Vittorie lampo contro piemontesi e austriaci, ingresso trionfale a Milano. Ma anche saccheggi, repressioni e la cessione di Venezia all'Austria con il Trattato di Campoformio."
    ),
  });

  await createNode({
    title: "Campagna d'Egitto — Battaglia delle Piramidi",
    slug: "campagna-egitto-piramidi",
    parent_id: ascesaId,
    year: 1798,
    end_year: 1799,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgPiramidi),
    description: dast(
      "\"Soldati! Dall'alto di queste piramidi, quaranta secoli di storia vi guardano!\" La più spettacolare e surreale delle guerre di Napoleone.",
      "L'impresa ha una sua logica: colpire le comunicazioni dell'impero coloniale inglese. Ma la flotta francese viene distrutta da Nelson ad Abukir, condannando la spedizione."
    ),
  });

  await createNode({
    title: "Colpo di stato del 18 Brumaio",
    slug: "colpo-stato-brumaio",
    parent_id: ascesaId,
    year: 1799,
    month: 11,
    day: 9,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgBrumaio),
    description: dast(
      "Napoleone abbatte il Direttorio con un colpo di stato militare e lo sostituisce con il Consolato. Ruolo decisivo del fratello Luciano, presidente del Consiglio dei Cinquecento.",
      "\"Che un semplice cittadino osasse impugnare da solo i destini di trenta milioni di uomini senza una lacrima, una goccia di sangue versata: è un'impresa gigantesca e sublime.\""
    ),
  });

  await createNode({
    title: "Battaglia di Marengo",
    slug: "battaglia-marengo",
    parent_id: ascesaId,
    year: 1800,
    month: 6,
    day: 14,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgMarengo),
    description: dast(
      "Vittoria sull'Austria che consolida il potere di Napoleone. In realtà la stava perdendo: fu salvato dall'arrivo di Desaix, che morì nello scontro.",
      "\"Forse la gloria è proprio così che funziona: una cosa che vive nei cuori degli uomini ingenui, che non ha bisogno di un radicamento nella realtà.\""
    ),
  });

  await createNode({
    title: "Incoronazione imperiale",
    slug: "incoronazione-imperiale",
    parent_id: ascesaId,
    year: 1804,
    month: 12,
    day: 2,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgCoronation),
    description: dast(
      "Cerimonia modellata su Carlo Magno. Papa Pio VII convocato a Parigi, ma Napoleone si mette la corona in testa da solo. Non voleva che nessun Papa potesse vantarsi di avergliela data.",
      "\"C'è solo un passo dal sublime al ridicolo.\" Una grande cerimonia, folla di parvenu travestiti da marescialli e principi."
    ),
  });

  // ── 3. L'IMPERO (1805–1812) ────────────────────────────────────────────
  console.log("\n👑 L'IMPERO");
  const imgAusterlitz = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/b/ba/La_bataille_d%27Austerlitz._2_decembre_1805_%28Fran%C3%A7ois_G%C3%A9rard%29.jpg",
    "Battaglia di Austerlitz — François Gérard"
  );
  const imgJena = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/e/e8/Iena.jpg",
    "Battaglia di Jena"
  );
  const imgWagram = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/9/9d/Napoleon_Wagram.jpg",
    "Battaglia di Wagram"
  );
  const imgMariaLuisa = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/5/5f/Empress_Marie_Louise_of_the_French.jpg",
    "Maria Luisa d'Austria"
  );
  const imgRussia = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/c/c8/IV_corpo_durante_la_campagna_di_Russia.jpg",
    "Campagna di Russia"
  );

  const imperoId = await createNode({
    title: "L'Impero",
    slug: "impero-napoleonico",
    parent_id: napoleoneId,
    color: hex("#7C3AED"),
    year: 1805,
    end_year: 1812,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgAusterlitz),
    description: dast(
      "Austerlitz, Jena, Wagram. L'esercito è una macchina di promozione sociale: tre quarti degli ufficiali sono ex soldati semplici. Ma l'impero è anche dispotismo: censura, plebisciti truccati, conformismo religioso.",
      "Il Codice Napoleonico resta il lascito più duraturo. Il divorzio da Giuseppina e il matrimonio con Maria Luisa d'Austria segnano l'illusione di essere accettato dalle vecchie dinastie. La campagna di Russia segna l'inizio della fine."
    ),
  });

  await createNode({
    title: "Battaglia di Austerlitz",
    slug: "battaglia-austerlitz",
    parent_id: imperoId,
    year: 1805,
    month: 12,
    day: 2,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgAusterlitz),
    description: dast(
      "La più grande vittoria di Napoleone, nel primo anniversario dell'incoronazione. Una nobildonna tedesca terrorizzata disse a Madame de Staël: \"Sono giunti i tempi dell'Apocalisse! Robespierre a cavallo attraversa l'Austria!\"",
      "L'esercito napoleonico dimostra la sua superiorità tattica contro le forze combinate di Austria e Russia."
    ),
  });

  await createNode({
    title: "Battaglia di Jena — Hegel vede \"l'anima del mondo\"",
    slug: "battaglia-jena-hegel",
    parent_id: imperoId,
    year: 1806,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgJena),
    description: dast(
      "Napoleone attraversa Jena alla testa delle sue truppe. Hegel scrive: \"L'Imperatore, quest'anima del mondo, l'ho visto cavalcare attraverso la città.\"",
      "\"È una sensazione meravigliosa vedere un tale individuo che qui, concentrato in un punto, seduto su un cavallo, si irradia sul mondo e lo domina.\""
    ),
  });

  await createNode({
    title: "Battaglia di Wagram e divorzio da Giuseppina",
    slug: "wagram-divorzio-giuseppina",
    parent_id: imperoId,
    year: 1809,
    visibility: "main",
    event_type: "event",
    featured_image: img(imgWagram),
    description: dast(
      "Napoleone domina l'Europa dalla Spagna alla Polonia. Ma commette un errore fatale: invece di eliminare le vecchie dinastie, crede di potersi alleare con loro.",
      "Divorzia da Giuseppina per ottenere un erede. \"L'amore, nella vita di un uomo, ha solo un capitolo. Nella vita di una donna, è tutta la storia.\""
    ),
  });

  await createNode({
    title: "Matrimonio con Maria Luisa d'Austria",
    slug: "matrimonio-maria-luisa",
    parent_id: imperoId,
    year: 1810,
    visibility: "main",
    event_type: "event",
    featured_image: img(imgMariaLuisa),
    description: dast(
      "Napoleone si imparenta con gli Asburgo sposando la figlia dell'imperatore d'Austria. Crede davvero che i sovrani europei lo abbiano accettato come uno di famiglia.",
      "Maria Luisa: \"Era stata cresciuta nell'odio verso tutti i rivoluzionari francesi. A 18 anni mio padre mi ordinava di sposarne il capo. Ho obbedito senza protestare.\""
    ),
  });

  await createNode({
    title: "Campagna di Russia — il disastro",
    slug: "campagna-russia-disastro",
    parent_id: imperoId,
    year: 1812,
    visibility: "super",
    event_type: "incident",
    featured_image: img(imgRussia),
    description: dast(
      "Napoleone invade la Russia con mezzo milione di uomini. I russi non giocano secondo le regole: perdono le battaglie e si ritirano, bruciano Mosca piuttosto che lasciarla al nemico.",
      "\"Ci disse che sarebbe bastato solo un mese. E noi, come al solito, gli credemmo.\" La ritirata nell'inverno russo distrugge la Grande Armata."
    ),
  });

  // ── 4. LA CADUTA (1813–1821) ───────────────────────────────────────────
  console.log("\n⛓️ LA CADUTA");
  const imgHundredDays = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/4/42/The_battles_of_Napoleon%27s_hundred_days.jpg",
    "I Cento Giorni di Napoleone"
  );
  const imgDeath = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/8/8b/Napoleon_death-Charles_von_Steuben-IMG_1512.JPG",
    "Morte di Napoleone a Sant'Elena"
  );

  const cadutaId = await createNode({
    title: "La caduta",
    slug: "caduta-napoleone",
    parent_id: napoleoneId,
    color: hex("#475569"),
    year: 1813,
    end_year: 1821,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgDeath),
    description: dast(
      "La Germania insorge, perfino il suocero austriaco dichiara guerra. Abdicazione, esilio all'Elba, fuga, Cento Giorni, Waterloo, Sant'Elena.",
      "\"Passerà del tempo prima che nasca un altro uomo così su questa terra. Nel bene e nel male.\" — Luciano Bonaparte"
    ),
  });

  await createNode({
    title: "La Germania insorge — l'Europa contro Napoleone",
    slug: "germania-insorge-europa",
    parent_id: cadutaId,
    year: 1813,
    visibility: "main",
    event_type: "incident",
    description: dast(
      "Tutta la Germania insorge contro Napoleone. Perfino suo suocero, l'imperatore d'Austria, gli dichiara guerra. Per difendere la Francia ha soltanto un esercito di coscritti giovanissimi.",
      "I tedeschi li soprannominano i \"Marie-Louise\". Poveri ragazzi, così giovani, ma così devoti al loro imperatore."
    ),
  });

  await createNode({
    title: "Abdicazione ed esilio all'Isola d'Elba",
    slug: "abdicazione-esilio-elba",
    parent_id: cadutaId,
    year: 1814,
    month: 4,
    visibility: "super",
    event_type: "incident",
    description: dast(
      "Gli alleati entrano a Parigi. I marescialli lo obbligano ad abdicare. La Francia non ne può più.",
      "\"L'Imperatore dichiara di rinunziare ai troni di Francia e d'Italia, perché non v'è alcun sacrificio personale che egli non sia pronto a fare nell'interesse della Francia.\" Esiliato all'Isola d'Elba."
    ),
  });

  await createNode({
    title: "Fuga dall'Elba — i Cento Giorni",
    slug: "fuga-elba-cento-giorni",
    parent_id: cadutaId,
    year: 1815,
    month: 3,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgHundredDays),
    description: dast(
      "Dopo dieci mesi scappa dall'Elba e torna in Francia. Gran parte del paese e quasi tutto l'esercito lo acclamano. Promette una nuova Costituzione democratica.",
      "Madame de Staël: \"Quando al Congresso di Vienna giunse la notizia, ci mettemmo tutti a ridere. Prendemmo la cosa come una barzelletta.\" Quella barzelletta è costata all'Europa altre 50.000 morti."
    ),
  });

  await createNode({
    title: "Morte a Sant'Elena — \"Ei fu\"",
    slug: "morte-sant-elena",
    parent_id: cadutaId,
    year: 1821,
    month: 5,
    day: 5,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgDeath),
    description: dast(
      "Esiliato a Sant'Elena, un'isola lontana dal mondo. \"Qui soffia sempre un vento impetuoso, con pioggia e una nebbia che mi taglia l'anima.\" Muore il 5 maggio 1821 dopo sei anni di ozio e ricordi.",
      "La notizia arriva in Italia il 17 luglio. Manzoni scrive Il Cinque Maggio: \"Ei fu. Siccome immobile, dato il mortal sospiro, stette la spoglia immemore orba di tanto spiro.\""
    ),
  });

  // ── 5. LA BATTAGLIA DI WATERLOO (15–18 GIUGNO 1815) ────────────────────
  console.log("\n🔥 LA BATTAGLIA DI WATERLOO");
  const imgWaterloo = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/7/72/Battle_of_Waterloo_1815.PNG",
    "Battaglia di Waterloo"
  );
  const imgLigny = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/0/02/Battle_of_Ligny.JPG",
    "Battaglia di Ligny"
  );
  const imgQuatreBras = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/b/be/The_Prince_of_Orange_at_Quatre_Bras.jpg",
    "Scontro di Quatre-Bras"
  );
  const imgWellington = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/c/cb/Sir_Arthur_Wellesley%2C_1st_Duke_of_Wellington.jpg",
    "Duca di Wellington"
  );

  const waterlooId = await createNode({
    title: "La battaglia di Waterloo",
    slug: "battaglia-waterloo",
    parent_id: napoleoneId,
    color: hex("#DC2626"),
    year: 1815,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgWaterloo),
    description: dast(
      "L'ultima battaglia di Napoleone, 18 giugno 1815. L'esercito arcaico inglese, fondato su privilegi e punizioni corporali, vince contro quello moderno francese, fondato sull'eguaglianza e la meritocrazia.",
      "La storiografia inglese ha dominato la narrazione, minimizzando il ruolo cruciale dei prussiani che hanno consumato la riserva di Napoleone rendendo possibile la vittoria di Wellington.",
      "Basato sulla conferenza di Alessandro Barbero al Festival della Mente di Sarzana."
    ),
  });

  await createNode({
    title: "L'esercito francese entra in Belgio",
    slug: "esercito-francese-entra-belgio",
    parent_id: waterlooId,
    year: 1815,
    month: 6,
    day: 15,
    visibility: "main",
    event_type: "event",
    description: dast(
      "Napoleone sigilla le frontiere: dalla Francia non esce più neanche una lettera. L'Armée du Nord, circa 100.000 uomini, marcia fino alla frontiera ed entra in Belgio la sera del 15 giugno.",
      "Gli eserciti nemici sono sparsi per tutto il Belgio, accantonati a casa dei contadini. La notizia dell'invasione è terrificante: inglesi e prussiani sono ancora disuniti."
    ),
  });

  await createNode({
    title: "Battaglia di Ligny — ultima vittoria di Napoleone",
    slug: "battaglia-ligny-ultima-vittoria",
    parent_id: waterlooId,
    year: 1815,
    month: 6,
    day: 16,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgLigny),
    description: dast(
      "Napoleone con l'ala destra e tutta la riserva affronta i prussiani a Ligny. Li sconfigge duramente e li mette in fuga. È l'ultima vittoria di Napoleone.",
      "Convinto di averli eliminati dalla partita, manda una parte dell'ala destra a inseguirli. Non immagina che i prussiani riusciranno a riorganizzarsi."
    ),
  });

  await createNode({
    title: "Scontro di Quatre-Bras",
    slug: "scontro-quatre-bras",
    parent_id: waterlooId,
    year: 1815,
    month: 6,
    day: 16,
    visibility: "main",
    event_type: "event",
    featured_image: img(imgQuatreBras),
    description: dast(
      "Mentre Napoleone batte i prussiani a Ligny, l'ala sinistra francese combatte contro Wellington a Quatre-Bras. Gli inglesi tengono, ma alla sera vengono a sapere del disastro prussiano e si ritirano verso Bruxelles."
    ),
  });

  await createNode({
    title: "Wellington si ritira — i prussiani promettono rinforzi",
    slug: "wellington-ritira-prussiani-promettono",
    parent_id: waterlooId,
    year: 1815,
    month: 6,
    day: 17,
    visibility: "main",
    event_type: "event",
    featured_image: img(imgWellington),
    description: dast(
      "Per tutto il 17 l'esercito inglese arretra sulla strada di Bruxelles, inseguito dai francesi. Wellington sa che da solo non può fermare Napoleone.",
      "Disperatamente manda corrieri ai prussiani. Si scrivono in francese, l'unica lingua che tutti conoscono. I prussiani promettono: \"Ce la possiamo fare, ti manderemo dei soccorsi.\" Wellington decide di fermarsi sulla cresta di Waterloo."
    ),
  });

  await createNode({
    title: "Il I corpo attacca — 15.000 uomini respinti dalla cavalleria",
    slug: "primo-corpo-attacca-respinto",
    parent_id: waterlooId,
    year: 1815,
    month: 6,
    day: 18,
    visibility: "main",
    event_type: "key_moment",
    description: dast(
      "Napoleone manda all'attacco il I corpo: 15.000 uomini in formazione serrata, al passo cadenzato. Ha indovinato il punto debole di Wellington. La linea inglese si sta sfaldando.",
      "Ma Wellington gioca la sua unica carta: un migliaio di cavalleggeri. I francesi, in cima alla collinetta, se li vedono arrivare addosso con le sciabole sguainate. Il panico li travolge. 15.000 uomini fuggono a rotta di collo."
    ),
  });

  await createNode({
    title: "I prussiani emergono — la riserva si consuma",
    slug: "prussiani-emergono-riserva-consuma",
    parent_id: waterlooId,
    year: 1815,
    month: 6,
    day: 18,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Mentre la cavalleria francese si logora contro i quadrati inglesi, le prime colonne prussiane sbucano dalla boscaglia sul fianco di Napoleone. Lui aveva 37 battaglioni di riserva per il colpo finale.",
      "Deve mandarne 15 a fronteggiare i prussiani, poi 8 della Giovane Guardia, poi 2 della Vecchia Guardia a riconquistare Plancenoit alla baionetta. Dei 37 battaglioni gliene restano solo 11."
    ),
  });

  await createNode({
    title: "L'attacco finale della Guardia fallisce — la disfatta",
    slug: "attacco-finale-guardia-fallisce",
    parent_id: waterlooId,
    year: 1815,
    month: 6,
    day: 18,
    visibility: "super",
    event_type: "incident",
    featured_image: img(imgWaterloo),
    description: dast(
      "L'attacco che doveva essere fatto con 37 battaglioni viene fatto con 11. La Guardia avanza sotto il fuoco, ma Wellington butta avanti tutta la fanteria inglese rimasta. \"Li vedevamo avanzare e sembrava una massa che si squagliava colpita dal vento.\"",
      "Quando l'esercito francese vede la Guardia arretrare, decide che è finita. L'intero esercito comincia a ritirarsi. Due giorni dopo i generali radunano metà dell'esercito: moltissimi sono semplicemente tornati a casa."
    ),
  });

  console.log("\n✅ Seed completato! 1 nodo Storia, 1 nodo Napoleone, 5 sotto-temi, 27 eventi.");
}

main().catch(e => {
  console.error("Errore:", e);
  process.exit(1);
});
