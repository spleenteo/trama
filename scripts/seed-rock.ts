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
  console.log("\n🎸 Rock — Nodo radice");
  const imgRollingStones = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/1/10/The_Rolling_Stones_Summerfest_in_Milwaukee_-_2015.jpg",
    "The Rolling Stones"
  );

  const rootId = await createNode({
    title: "Rock",
    slug: "rock",
    parent_id: "V5o64yoUTg-rYhgNUPTRkQ",
    color: hex("#DC2626"),
    year: 1963,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgRollingStones),
    description: dast(
      "Il rock e una delle forme espressive piu potenti della cultura moderna, nato dalla fusione di blues, country e rhythm and blues negli anni cinquanta e sviluppatosi in decine di sottogeneri che hanno segnato ogni decennio del Novecento.",
      "Dai garage di Liverpool alle arene globali, il rock ha espresso ribellione, amore, critica sociale e sperimentazione sonora, diventando la colonna sonora delle generazioni del XX e XXI secolo."
    ),
  });

  // ── 1. The Rolling Stones — Debutto 1963 ──────────────────────────────────
  console.log("\n1. The Rolling Stones — Debutto 1963");
  await createNode({
    title: "The Rolling Stones — Debutto e primo singolo \"Come On\"",
    slug: "rolling-stones-debutto-1963",
    parent_id: rootId,
    year: 1963,
    month: 6,
    day: 7,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgRollingStones),
    description: dast(
      "Il 7 giugno 1963 i Rolling Stones pubblicano il loro primo singolo, una cover di \"Come On\" di Chuck Berry. La band di Mick Jagger e Keith Richards era nata a Londra nel 1962 e avrebbe presto sfidato i Beatles per il titolo di piu grande band rock del mondo.",
      "Dove i Beatles incarnavano charme e melodia, gli Stones offrivano grezzo blues britannico e attitudine ribelle. Il loro stile senza filtri avrebbe ispirato generazioni di band, dal punk al grunge, per i sessant'anni successivi."
    ),
  });

  // ── 2. British Invasion — Beatles all'Ed Sullivan Show 1964 ───────────────
  console.log("\n2. British Invasion — Beatles all'Ed Sullivan Show 1964");
  const imgBeatles = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg",
    "The Beatles"
  );
  await createNode({
    title: "British Invasion — I Beatles conquistano l'America",
    slug: "british-invasion-beatles-ed-sullivan-1964",
    parent_id: rootId,
    year: 1964,
    month: 2,
    day: 9,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgBeatles),
    description: dast(
      "Il 9 febbraio 1964, 73 milioni di americani guardano i Beatles all'Ed Sullivan Show: e il momento in cui la British Invasion travolge gli Stati Uniti. In pochi mesi Rolling Stones, The Who, Kinks e decine di band britanniche colonizzano le classifiche americane.",
      "L'impatto fu sismico: il rock cessa di essere un fenomeno prevalentemente americano e diventa un linguaggio globale. I Beatles ridefinirono la struttura della canzone pop-rock, la produzione discografica e il concetto stesso di band come entita artistica autonoma."
    ),
  });

  // ── 3. The Who — My Generation 1965 ──────────────────────────────────────
  console.log("\n3. The Who — My Generation 1965");
  const imgWho = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/9/92/Who_-_1975.jpg",
    "The Who"
  );
  await createNode({
    title: "The Who — My Generation, l'inno proto-punk",
    slug: "the-who-my-generation-1965",
    parent_id: rootId,
    year: 1965,
    month: 11,
    day: 5,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgWho),
    description: dast(
      "\"My Generation\" dei The Who (novembre 1965) e uno degli anthem piu potenti della storia del rock. Il balbettio intenzionale di Roger Daltrey, la chitarra di Pete Townshend e la frase \"I hope I die before I get old\" catturano lo spirito della gioventu britannica degli anni sessanta.",
      "I The Who portano sul palco la distruzione rituale degli strumenti e un'energia fisica devastante. Anticipano il punk di un decennio e influenzano chiunque voglia usare il rock come atto di ribellione generazionale."
    ),
  });

  // ── 4. Jimi Hendrix — Are You Experienced 1967 ────────────────────────────
  console.log("\n4. Jimi Hendrix — Are You Experienced 1967");
  const imgHendrix = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/a/aa/Jimi_Hendrix_%281967%29_%28cropped%29.jpg",
    "Jimi Hendrix"
  );
  await createNode({
    title: "Jimi Hendrix — Are You Experienced, la rivoluzione della chitarra",
    slug: "jimi-hendrix-are-you-experienced-1967",
    parent_id: rootId,
    year: 1967,
    month: 5,
    day: 12,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgHendrix),
    description: dast(
      "Con il debut album \"Are You Experienced\" (maggio 1967), Jimi Hendrix ridefinisce completamente il linguaggio della chitarra elettrica. Feedback, whammy bar, distorsione controllata e un senso melodico straordinario aprono possibilita sonore mai esplorate prima.",
      "Hendrix e un musicista di colore americano che sfonda in Inghilterra prima che in patria, portando il blues nero nel rock bianco e viceversa. La sua morte nel 1970, a soli 27 anni, lo consacra leggenda assoluta e fondatore del Club 27."
    ),
  });

  // ── 5. Monterey Pop Festival 1967 ─────────────────────────────────────────
  console.log("\n5. Monterey Pop Festival 1967");
  await createNode({
    title: "Monterey Pop Festival — Il primo grande festival rock",
    slug: "monterey-pop-festival-1967",
    parent_id: rootId,
    year: 1967,
    month: 6,
    day: 16,
    visibility: "regular",
    event_type: "key_moment",
    description: dast(
      "Il Monterey International Pop Festival (16-18 giugno 1967) e il primo grande festival rock della storia, con 200.000 presenze. Sul palco: Jimi Hendrix brucia la chitarra, Janis Joplin esplode come star, The Who distruggono gli strumenti, Otis Redding conquista la folla bianca.",
      "Monterey anticipa Woodstock di due anni e definisce il format del festival rock come evento comunitario, politico e spirituale. Il documentario di D.A. Pennebaker ne immortala il momento."
    ),
  });

  // ── 6. Led Zeppelin — Debut album 1969 ───────────────────────────────────
  console.log("\n6. Led Zeppelin — Debut 1969");
  const imgLedZeppelin = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/6/63/Led_Zeppelin_-_promotional_image_%281971%29.jpg",
    "Led Zeppelin"
  );
  await createNode({
    title: "Led Zeppelin — Debut album, la nascita dell'hard rock",
    slug: "led-zeppelin-debut-1969",
    parent_id: rootId,
    year: 1969,
    month: 1,
    day: 12,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgLedZeppelin),
    description: dast(
      "Il 12 gennaio 1969 esce il primo album dei Led Zeppelin, registrato in soli 36 ore. Jimmy Page, Robert Plant, John Paul Jones e John Bonham fondono blues americano, folk celtico e potenza elettrica in un suono del tutto nuovo: l'hard rock.",
      "Nei sei anni successivi i Led Zeppelin pubblicano album che ridefiniscono i limiti del rock: da \"Led Zeppelin IV\" (1971) con \"Stairway to Heaven\" a \"Physical Graffiti\" (1975). La loro influenza attraversa heavy metal, grunge e rock contemporaneo."
    ),
  });

  // ── 7. Woodstock 1969 ─────────────────────────────────────────────────────
  console.log("\n7. Woodstock 1969");
  const imgWoodstock = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/b/b7/Woodstock_poster.jpg",
    "Woodstock 1969"
  );
  await createNode({
    title: "Woodstock — Il festival simbolo della controcultura",
    slug: "woodstock-1969",
    parent_id: rootId,
    year: 1969,
    month: 8,
    day: 15,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgWoodstock),
    description: dast(
      "Dal 15 al 18 agosto 1969, quasi 500.000 persone si radunano a Woodstock, New York, per tre giorni di musica, pace e fango. Si esibiscono Jimi Hendrix, Janis Joplin, The Who, Jefferson Airplane, Joe Cocker, Crosby Stills Nash and Young.",
      "Woodstock diventa il simbolo del movimento hippie e della controcultura degli anni sessanta: la prova che una generazione puo aggregarsi pacificamente su scala massima. Ma e anche un momento irripetibile: la stagione si chiude pochi mesi dopo con la tragedia di Altamont."
    ),
  });

  // ── 8. Altamont 1969 ──────────────────────────────────────────────────────
  console.log("\n8. Altamont 1969");
  const imgAltamont = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/e/ec/Rolling_Stones_at_Altamont_1969.jpg",
    "Rolling Stones ad Altamont"
  );
  await createNode({
    title: "Altamont — Il concerto che chiuse gli anni Sessanta",
    slug: "altamont-1969",
    parent_id: rootId,
    year: 1969,
    month: 12,
    day: 6,
    visibility: "main",
    event_type: "incident",
    featured_image: img(imgAltamont),
    description: dast(
      "Il 6 dicembre 1969, all'Altamont Speedway di San Francisco, i Rolling Stones tengono un concerto gratuito davanti a 300.000 persone. Gli Hells Angels, assoldati come servizio d'ordine, uccidono un giovane di fronte al palco durante l'esibizione degli Stones.",
      "Altamont e considerato la fine simbolica del sogno hippie: la morte di Meredith Hunter dimostra che la pace e l'amore di Woodstock erano fragilissimi. Il critico rock Lester Bangs lo chiama il giorno in cui il rock and roll mori."
    ),
  });

  // ── 9. Black Sabbath — Paranoid 1970 ─────────────────────────────────────
  console.log("\n9. Black Sabbath — Paranoid 1970");
  const imgSabbath = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/4/42/Sabs.jpg",
    "Black Sabbath"
  );
  await createNode({
    title: "Black Sabbath — Paranoid, la nascita dell'heavy metal",
    slug: "black-sabbath-paranoid-1970",
    parent_id: rootId,
    year: 1970,
    month: 9,
    day: 18,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgSabbath),
    description: dast(
      "Con il debut album omonimo (febbraio 1970) e soprattutto con \"Paranoid\" (settembre 1970), i Black Sabbath di Birmingham inventano l'heavy metal. Tony Iommi suona con le dita amputate, usando accordi diminuiti che producono un suono oscuro e minaccioso mai sentito prima.",
      "Ozzy Osbourne, Geezer Butler e Bill Ward completano la formazione che definisce i pilastri del genere: riff pesanti, temi cupi, ritmo lento e oppressivo. Ogni sottogenere del metal, dal doom al thrash, deve qualcosa a questa band di operai di Birmingham."
    ),
  });

  // ── 10. The Doors — morte di Jim Morrison 1971 ────────────────────────────
  console.log("\n10. The Doors — morte di Jim Morrison 1971");
  const imgDoors = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/6/69/The_Doors_1968.JPG",
    "The Doors"
  );
  await createNode({
    title: "The Doors — La morte di Jim Morrison a Parigi",
    slug: "jim-morrison-morte-1971",
    parent_id: rootId,
    year: 1971,
    month: 7,
    day: 3,
    visibility: "main",
    event_type: "incident",
    featured_image: img(imgDoors),
    description: dast(
      "Il 3 luglio 1971, Jim Morrison viene trovato morto nella vasca da bagno del suo appartamento a Parigi. Aveva 27 anni. La causa ufficiale e arresto cardiaco, ma le circostanze restano misteriose. Morrison era gia una leggenda vivente: poeta, performer carismatico e simbolo del rock psichedelico.",
      "I Doors avevano trasformato il rock in teatro, con Morrison come sacerdote oscuro. La sua morte lo aggiunge al Club 27 insieme a Jimi Hendrix, Janis Joplin e Brian Jones -- artisti consumati dalla propria intensita."
    ),
  });

  // ── 11. David Bowie — Ziggy Stardust 1972 ────────────────────────────────
  console.log("\n11. David Bowie — Ziggy Stardust 1972");
  const imgBowie = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/e/e8/David-Bowie_Chicago_2002-08-08_photoby_Adam-Bielawski-cropped.jpg",
    "David Bowie"
  );
  await createNode({
    title: "David Bowie — Ziggy Stardust e la nascita del glam rock",
    slug: "david-bowie-ziggy-stardust-1972",
    parent_id: rootId,
    year: 1972,
    month: 6,
    day: 16,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgBowie),
    description: dast(
      "Il 16 giugno 1972 David Bowie pubblica \"The Rise and Fall of Ziggy Stardust and the Spiders from Mars\", concept album su una rockstar aliena. Bowie trasforma il rock in teatro totale: costumi, alter ego, ambiguita sessuale e innovazione visiva diventano parte inseparabile della musica.",
      "Il glam rock che Bowie porta al mainstream anticipa i movimenti queer nella musica pop e apre la strada a artisti come Queen, Prince e Madonna. Nei decenni successivi Bowie continua a reinventarsi fino alla morte nel 2016."
    ),
  });

  // ── 12. Pink Floyd — The Dark Side of the Moon 1973 ──────────────────────
  console.log("\n12. Pink Floyd — Dark Side of the Moon 1973");
  const imgPinkFloyd = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Pink_Floyd%2C_1971_%28HQ%29.jpg",
    "Pink Floyd"
  );
  await createNode({
    title: "Pink Floyd — The Dark Side of the Moon",
    slug: "pink-floyd-dark-side-of-the-moon-1973",
    parent_id: rootId,
    year: 1973,
    month: 3,
    day: 1,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgPinkFloyd),
    description: dast(
      "Il 1 marzo 1973 esce \"The Dark Side of the Moon\" dei Pink Floyd. L'album rimane in classifica per 741 settimane non consecutive -- record assoluto -- e vende oltre 50 milioni di copie. E una meditazione su follia, tempo, denaro e morte che trasforma il rock progressivo in esperienza totale.",
      "Roger Waters, David Gilmour, Rick Wright e Nick Mason usano lo studio di registrazione come strumento: registrazioni ambient, voci parlate, battiti cardiaci. L'album definisce il concetto di rock come opera d'arte unitaria e cinematografica."
    ),
  });

  // ── 13. Queen — Bohemian Rhapsody 1975 ───────────────────────────────────
  console.log("\n13. Queen — Bohemian Rhapsody 1975");
  const imgQueen = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/e/ec/Queen_A_Night_At_The_Opera_%281975_Elektra_publicity_photo_02%29.jpg",
    "Queen"
  );
  await createNode({
    title: "Queen — Bohemian Rhapsody rivoluziona il rock",
    slug: "queen-bohemian-rhapsody-1975",
    parent_id: rootId,
    year: 1975,
    month: 11,
    day: 21,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgQueen),
    description: dast(
      "Il 31 ottobre 1975 i Queen pubblicano \"Bohemian Rhapsody\": sei minuti che mescolano ballad, opera, hard rock e metalinguaggio in una forma mai vista prima. Freddie Mercury, Brian May, Roger Taylor e John Deacon rifiutano ogni etichetta di genere.",
      "La canzone resta in classifica per 9 settimane consecutive nel Regno Unito. Il video promozionale inventa de facto il music video moderno. I Queen portano il rock negli stadi con una teatralita totale che culmina nell'esibizione-leggenda al Live Aid del 1985."
    ),
  });

  // ── 14. Bruce Springsteen — Born to Run 1975 ─────────────────────────────
  console.log("\n14. Bruce Springsteen — Born to Run 1975");
  const imgSpringsteen = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/9/93/Bruce_Springsteen_Springsteen-79_%28cropped%29.jpg",
    "Bruce Springsteen"
  );
  await createNode({
    title: "Bruce Springsteen — Born to Run, la voce dell'America operaia",
    slug: "bruce-springsteen-born-to-run-1975",
    parent_id: rootId,
    year: 1975,
    month: 8,
    day: 25,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgSpringsteen),
    description: dast(
      "Il 25 agosto 1975 esce \"Born to Run\" di Bruce Springsteen. L'album porta il Boss sulle copertine simultanee di Time e Newsweek: non era mai successo a un musicista rock. Springsteen canta di fuga, sogni americani e giovani operai che cercano una via d'uscita dalle periferie del New Jersey.",
      "Il rock di Springsteen e cinematografico, epico, profondamente americano. La sua influenza sulla tradizione rock-as-storytelling e immensa: da Tom Petty ai cantautori indie contemporanei."
    ),
  });

  // ── 15. Ramones — Debut album 1976 ───────────────────────────────────────
  console.log("\n15. Ramones — Debut 1976");
  const imgRamones = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/f/f8/Ramones_rocket_to_russia_photo.jpg",
    "Ramones"
  );
  await createNode({
    title: "Ramones — Debut album, la rivoluzione punk di New York",
    slug: "ramones-debut-1976",
    parent_id: rootId,
    year: 1976,
    month: 4,
    day: 23,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgRamones),
    description: dast(
      "Il 23 aprile 1976 i Ramones pubblicano il loro primo album: 14 canzoni in 28 minuti, accordi minimali, testi semplici e velocita devastante. Dal CBGB di New York, Joey, Johnny, Dee Dee e Tommy Ramone ridefiniscono il rock stripping-down all'osso puro.",
      "Il tour britannico del luglio 1976 ispira direttamente i Sex Pistols, i Clash e buona parte del punk inglese. I Ramones non vendono molti dischi ma la loro influenza sulla musica successiva e incalcolabile: ogni band indie, pop-punk o alternative deve qualcosa ai fratelli del Queens."
    ),
  });

  // ── 16. Sex Pistols — Never Mind the Bollocks 1977 ────────────────────────
  console.log("\n16. Sex Pistols — Never Mind the Bollocks 1977");
  const imgSexPistols = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Sex_Pistols_in_Paradiso.jpg",
    "Sex Pistols"
  );
  await createNode({
    title: "Sex Pistols — Never Mind the Bollocks, l'esplosione punk britannica",
    slug: "sex-pistols-never-mind-the-bollocks-1977",
    parent_id: rootId,
    year: 1977,
    month: 10,
    day: 28,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgSexPistols),
    description: dast(
      "Il 28 ottobre 1977 i Sex Pistols pubblicano l'unico album in studio, \"Never Mind the Bollocks, Here's the Sex Pistols\". Johnny Rotten, Sid Vicious, Steve Jones e Paul Cook distillano nichilismo e energia grezza in un attacco frontale all'Inghilterra di Sua Maesta.",
      "Il punk britannico non e solo musica: e moda, grafica, attitudine anti-sistema. Malcolm McLaren e Vivienne Westwood costruiscono un look che entra nella storia. In un anno i Sex Pistols esistono, esplodono e si sciolgono -- ma cambiano il rock per sempre."
    ),
  });

  // ── 17. The Clash — Debut album 1977 ─────────────────────────────────────
  console.log("\n17. The Clash — Debut 1977");
  const imgClash = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/3/34/Clash_21051980_12_800.jpg",
    "The Clash"
  );
  await createNode({
    title: "The Clash — Debut album, il punk si fa politico",
    slug: "the-clash-debut-1977",
    parent_id: rootId,
    year: 1977,
    month: 4,
    day: 8,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgClash),
    description: dast(
      "L'8 aprile 1977 i The Clash pubblicano il loro primo album omonimo. Joe Strummer e Mick Jones portano il punk oltre il nichilismo dei Sex Pistols: reggae, ska e rabbia politica si mescolano in un manifesto contro razzismo e capitalismo.",
      "\"London Calling\" (1979) e uno dei dieci album piu influenti della storia del rock. I Clash dimostrano che il punk puo essere intellettuale, aperto al mondo e ancora devastantemente potente. Il loro legacy ispira il rock alternativo degli anni ottanta e novanta."
    ),
  });

  // ── 18. AC/DC — Back in Black 1980 ───────────────────────────────────────
  console.log("\n18. AC/DC — Back in Black 1980");
  const imgACDC = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/AC_DC_Black_Ice_Tour_2009_Buenos_Aires_4_de_Diciembre_%284238680962%29.jpg",
    "AC/DC"
  );
  await createNode({
    title: "AC/DC — Back in Black, il ritorno dopo la morte di Bon Scott",
    slug: "acdc-back-in-black-1980",
    parent_id: rootId,
    year: 1980,
    month: 7,
    day: 25,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgACDC),
    description: dast(
      "Il 25 luglio 1980 gli AC/DC pubblicano \"Back in Black\", pochi mesi dopo la morte per alcol del cantante Bon Scott. Con il nuovo frontman Brian Johnson, la band australiana registra l'album hard rock piu venduto di tutti i tempi: oltre 50 milioni di copie.",
      "\"Back in Black\" e un album di lutto e resurrezione: la copertina nera in memoria di Scott, il suono di campane a morto che apre l'album. Angus Young e Malcolm Young dimostrano che il rock piu duro puo essere anche il piu catartico."
    ),
  });

  // ── 19. John Lennon assassinato 1980 ──────────────────────────────────────
  console.log("\n19. John Lennon — Assassinato 1980");
  await createNode({
    title: "John Lennon assassinato a New York",
    slug: "john-lennon-assassinato-1980",
    parent_id: rootId,
    year: 1980,
    month: 12,
    day: 8,
    visibility: "super",
    event_type: "incident",
    description: dast(
      "L'8 dicembre 1980, alle 22:50, John Lennon viene assassinato davanti al suo appartamento al Dakota di New York da Mark David Chapman. Aveva 40 anni. La notizia scuote il mondo intero: milioni di persone si radunano spontaneamente in piazza ovunque.",
      "Lennon era il cuore intellettuale dei Beatles, il cantore di \"Imagine\", il pacifista irriducibile. La sua morte segna simbolicamente la fine dell'era rock classica e dell'idealismo degli anni sessanta. Central Park porta ancora il nome di Strawberry Fields in suo onore."
    ),
  });

  // ── 20. Metallica — Kill Em All 1983 ─────────────────────────────────────
  console.log("\n20. Metallica — Kill Em All 1983");
  const imgMetallica = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/8/81/Metallica_March_2024.jpg",
    "Metallica"
  );
  await createNode({
    title: "Metallica — Kill Em All, la nascita del thrash metal",
    slug: "metallica-kill-em-all-1983",
    parent_id: rootId,
    year: 1983,
    month: 7,
    day: 25,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgMetallica),
    description: dast(
      "Il 25 luglio 1983 i Metallica pubblicano il debut album \"Kill Em All\". James Hetfield, Lars Ulrich, Cliff Burton e Kirk Hammett fondono la velocita dei Ramones con la pesantezza dei Black Sabbath: nasce il thrash metal.",
      "In meno di dieci anni i Metallica portano il metal negli stadi con il \"Black Album\" (1991), primo disco thrash a raggiungere il numero uno nelle classifiche mondiali. La loro influenza sul rock degli anni ottanta e novanta e paragonabile solo a quella dei Led Zeppelin nel decennio precedente."
    ),
  });

  // ── 21. Live Aid 1985 ─────────────────────────────────────────────────────
  console.log("\n21. Live Aid 1985");
  await createNode({
    title: "Live Aid — Il concerto benefico che uni il rock",
    slug: "live-aid-1985",
    parent_id: rootId,
    year: 1985,
    month: 7,
    day: 13,
    visibility: "super",
    event_type: "key_moment",
    description: dast(
      "Il 13 luglio 1985, due stadi simultanei -- Wembley a Londra e JFK a Filadelfia -- ospitano il piu grande concerto rock della storia. Oltre 1,5 miliardi di persone guardano in televisione Queen, David Bowie, U2, Led Zeppelin, Mick Jagger e Paul McCartney.",
      "Organizzato da Bob Geldof per raccogliere fondi per la carestia in Etiopia, Live Aid segna il momento in cui il rock si fa consapevole del proprio peso politico e umanitario. I Queen di Freddie Mercury offrono quella sera la performance live piu celebrata della storia del rock."
    ),
  });

  // ── 22. U2 — The Joshua Tree 1987 ────────────────────────────────────────
  console.log("\n22. U2 — The Joshua Tree 1987");
  const imgU2 = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/a/ac/U2_on_Joshua_Tree_Tour_2017_Brussels_8-1-17.jpg",
    "U2"
  );
  await createNode({
    title: "U2 — The Joshua Tree, il rock come coscienza globale",
    slug: "u2-the-joshua-tree-1987",
    parent_id: rootId,
    year: 1987,
    month: 3,
    day: 9,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgU2),
    description: dast(
      "Il 9 marzo 1987 gli U2 pubblicano \"The Joshua Tree\". In pochi giorni diventa il disco che vende piu velocemente nella storia britannica. Bono, The Edge, Adam Clayton e Larry Mullen Jr. creano un album sull'America: i suoi miti, le sue contraddizioni e le sue promesse tradite.",
      "\"With or Without You\" e \"Where the Streets Have No Name\" sono tra le canzoni rock piu diffuse di sempre. Gli U2 diventano la piu grande band del mondo e dimostrano che il rock puo portare un peso politico senza perdere il pubblico di massa."
    ),
  });

  // ── 23. Guns N' Roses — Appetite for Destruction 1987 ────────────────────
  console.log("\n23. Guns N Roses — Appetite for Destruction 1987");
  const imgGNR = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/b/b9/GNR_Belgrade_2025_05_%28cropped%29.jpg",
    "Guns N Roses"
  );
  await createNode({
    title: "Guns N Roses — Appetite for Destruction",
    slug: "guns-n-roses-appetite-for-destruction-1987",
    parent_id: rootId,
    year: 1987,
    month: 7,
    day: 21,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgGNR),
    description: dast(
      "Il 21 luglio 1987 i Guns N Roses pubblicano il debut album \"Appetite for Destruction\". Axl Rose, Slash, Duff McKagan, Izzy Stradlin e Steven Adler riportano il rock ai suoi eccessi piu genuini: sex, drugs e heavy riff nel Los Angeles di Sunset Strip.",
      "L'album vende oltre 30 milioni di copie e resta il debut rock piu venduto di tutti i tempi. \"Welcome to the Jungle\", \"Paradise City\" e \"Sweet Child O Mine\" dominano le classifiche mondiali. I Guns diventano l'ultima grande band rock capace di riempire stadi nello stile classico."
    ),
  });

  // ── 24. Nirvana — Nevermind 1991 ──────────────────────────────────────────
  console.log("\n24. Nirvana — Nevermind 1991");
  const imgNirvana = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/1/19/Nirvana_around_1992.jpg",
    "Nirvana"
  );
  await createNode({
    title: "Nirvana — Nevermind, la rivoluzione grunge",
    slug: "nirvana-nevermind-1991",
    parent_id: rootId,
    year: 1991,
    month: 9,
    day: 24,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgNirvana),
    description: dast(
      "Il 24 settembre 1991 i Nirvana pubblicano \"Nevermind\". In pochi mesi spodesta Michael Jackson dalla vetta delle classifiche americane. Kurt Cobain, Krist Novoselic e Dave Grohl portano il suono grezzo di Seattle -- il grunge -- alla coscienza globale con \"Smells Like Teen Spirit\".",
      "Nevermind segna la morte dell'hair metal e l'ascesa dell'alternative rock come genere dominante degli anni novanta. Cobain incarnava la Generation X: disincantata, ironica, profondamente disagiata. La sua morte nel 1994 chiude tragicamente l'era del grunge."
    ),
  });

  // ── 25. Pearl Jam — Ten 1991 ──────────────────────────────────────────────
  console.log("\n25. Pearl Jam — Ten 1991");
  const imgPearlJam = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/4/40/Pearl_Jam_2016.jpg",
    "Pearl Jam"
  );
  await createNode({
    title: "Pearl Jam — Ten, Seattle conquista il mondo",
    slug: "pearl-jam-ten-1991",
    parent_id: rootId,
    year: 1991,
    month: 8,
    day: 27,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgPearlJam),
    description: dast(
      "Il 27 agosto 1991 i Pearl Jam pubblicano \"Ten\". Eddie Vedder, Stone Gossard, Mike McCready e Jeff Ament offrono un grunge meno nichilista e piu epico di Nirvana: canzoni come \"Alive\", \"Even Flow\" e \"Black\" costruiscono un legame emotivo diretto con il pubblico.",
      "I Pearl Jam diventano una delle band rock piu longeve e coerenti della loro generazione: rifiutano Ticketmaster, distribuiscono concerti bootleg e mantengono una relazione quasi familiare con i fan per tre decenni."
    ),
  });

  // ── 26. Red Hot Chili Peppers — Blood Sugar Sex Magik 1991 ───────────────
  console.log("\n26. RHCP — Blood Sugar Sex Magik 1991");
  const imgRHCP = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/1/14/RHCP_Live_in_London_26_June_2022.jpg",
    "Red Hot Chili Peppers"
  );
  await createNode({
    title: "Red Hot Chili Peppers — Blood Sugar Sex Magik",
    slug: "rhcp-blood-sugar-sex-magik-1991",
    parent_id: rootId,
    year: 1991,
    month: 9,
    day: 24,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgRHCP),
    description: dast(
      "Il 24 settembre 1991 i Red Hot Chili Peppers pubblicano \"Blood Sugar Sex Magik\", prodotto da Rick Rubin. Anthony Kiedis, Flea, John Frusciante e Chad Smith fondono funk, rock, rap e melodia in un ibrido che non esisteva prima.",
      "\"Under the Bridge\" e \"Give It Away\" mostrano le due anime della band: il lato intimo e malinconico e quello fisico e tribale. I RHCP aprono la strada alla fusione rock-funk che caratterizza gran parte del rock alternativo degli anni novanta."
    ),
  });

  // ── 27. Kurt Cobain — morte 1994 ──────────────────────────────────────────
  console.log("\n27. Kurt Cobain — morte 1994");
  const imgCobain = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Nirvana_around_1992_%28cropped%29.jpg",
    "Kurt Cobain"
  );
  await createNode({
    title: "Kurt Cobain — La morte del profeta del grunge",
    slug: "kurt-cobain-morte-1994",
    parent_id: rootId,
    year: 1994,
    month: 4,
    day: 5,
    visibility: "super",
    event_type: "incident",
    featured_image: img(imgCobain),
    description: dast(
      "Il 5 aprile 1994, a Seattle, Kurt Cobain si toglie la vita a 27 anni. La notizia viene resa pubblica il giorno 8. Il frontman dei Nirvana lascia una nota in cui cita Neil Young: \"better to burn out than to fade away\". Migliaia di fan si radunano a Seattle per una veglia collettiva.",
      "La morte di Cobain chiude simbolicamente l'era del grunge e apre quella post-grunge e alternative degli anni novanta. La sua eredita artistica e umana continua a influenzare il rock contemporaneo, dall'indie rock americano al bedroom pop."
    ),
  });

  // ── 28. Oasis — Definitely Maybe 1994 ────────────────────────────────────
  console.log("\n28. Oasis — Definitely Maybe 1994");
  const imgOasis = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/c/c0/Oasis_-_Principality_Stadium%2C_Cardiff_-_Friday_4th_July_2025_member_collage.jpg",
    "Oasis"
  );
  await createNode({
    title: "Oasis — Definitely Maybe, il britpop conquista il mondo",
    slug: "oasis-definitely-maybe-1994",
    parent_id: rootId,
    year: 1994,
    month: 8,
    day: 29,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgOasis),
    description: dast(
      "Il 29 agosto 1994 gli Oasis pubblicano \"Definitely Maybe\", il debut album piu velocemente venduto nella storia britannica. Liam e Noel Gallagher rilanciano il rock britannico con melodie immediate, chitarre roboanti e un'arroganza messianica.",
      "Il britpop che Oasis cavalcano insieme a Blur, Pulp e Suede e una risposta britannica al grunge americano: ottimismo, ironia e ammirazione per i Beatles. Knebworth 1996 -- due serate, 250.000 spettatori -- resta il piu grande concerto mai tenuto nel Regno Unito."
    ),
  });

  // ── 29. Foo Fighters — Debut 1995 ────────────────────────────────────────
  console.log("\n29. Foo Fighters — Debut 1995");
  const imgFooFighters = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/c/cb/Glasto2023.jpg",
    "Foo Fighters"
  );
  await createNode({
    title: "Foo Fighters — Debut album, la rinascita di Dave Grohl",
    slug: "foo-fighters-debut-1995",
    parent_id: rootId,
    year: 1995,
    month: 7,
    day: 4,
    visibility: "regular",
    event_type: "event",
    featured_image: img(imgFooFighters),
    description: dast(
      "Il 4 luglio 1995 i Foo Fighters di Dave Grohl pubblicano il loro album debut. Il batterista dei Nirvana, rimasto senza band dopo la morte di Cobain, registra quasi da solo l'intero album e forma una nuova band per portarlo dal vivo.",
      "I Foo Fighters diventano nei decenni successivi una delle band rock di maggiore successo al mondo, vincendo 12 Grammy e riempiendo stadi. Grohl incarna la continuita del rock tradizionale in un'era di frammentazione dei generi musicali."
    ),
  });

  // ── 30. Radiohead — OK Computer 1997 ─────────────────────────────────────
  console.log("\n30. Radiohead — OK Computer 1997");
  const imgRadiohead = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/a/a1/RadioheadO2211125_composite.jpg",
    "Radiohead"
  );
  await createNode({
    title: "Radiohead — OK Computer, rock e alienazione digitale",
    slug: "radiohead-ok-computer-1997",
    parent_id: rootId,
    year: 1997,
    month: 5,
    day: 21,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgRadiohead),
    description: dast(
      "Il 21 maggio 1997 i Radiohead pubblicano \"OK Computer\". Thom Yorke, Jonny Greenwood e i colleghi di Oxford creano un album su alienazione, globalizzazione e ansia tecnologica in un mondo sempre piu connesso e sempre meno umano.",
      "OK Computer viene votato piu volte come il miglior album degli anni novanta. Anticipa di vent'anni le ansie digitali del XXI secolo. Con \"Kid A\" (2000) i Radiohead abbandoneranno quasi completamente il rock tradizionale, continuando a influenzare ogni genere musicale contemporaneo."
    ),
  });

  // ── 31. Green Day — American Idiot 2004 ──────────────────────────────────
  console.log("\n31. Green Day — American Idiot 2004");
  const imgGreenDay = await upload(
    "https://upload.wikimedia.org/wikipedia/commons/a/ac/GreenDay_Isle_of_Wight_Montage.jpg",
    "Green Day"
  );
  await createNode({
    title: "Green Day — American Idiot, il punk revival degli anni 2000",
    slug: "green-day-american-idiot-2004",
    parent_id: rootId,
    year: 2004,
    month: 9,
    day: 21,
    visibility: "main",
    event_type: "key_moment",
    featured_image: img(imgGreenDay),
    description: dast(
      "Il 21 settembre 2004 i Green Day pubblicano \"American Idiot\", concept album sul disagio americano nell'era Bush e della guerra in Iraq. Billie Joe Armstrong, Mike Dirnt e Tre Cool trasformano il pop-punk in un atto politico e portano il genere sulle scene di Broadway.",
      "American Idiot vince il Grammy per il miglior album rock e vende oltre 15 milioni di copie. Riportano il rock politico al grande pubblico in un momento in cui il genere sembrava relegato ai margini. Insieme a My Chemical Romance e Fall Out Boy, i Green Day guidano il pop-punk revival degli anni duemila."
    ),
  });

  console.log("\n✅ Seed completato! 1 nodo radice Rock + 31 eventi diretti.");
}

main().catch(e => {
  console.error("Errore:", e);
  process.exit(1);
});
