import { buildClient } from "@datocms/cma-client-node";

const client = buildClient({ apiToken: "73cf92a8063412336c282a6f085a23" });

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
  // ── BLUES ──────────────────────────────────────────────────────────────────
  console.log("\n🎵 BLUES");
  const imgBessie = await upload("https://upload.wikimedia.org/wikipedia/commons/d/d0/Bessie_Smith_%281936%29_by_Carl_Van_Vechten.jpg", "Bessie Smith");
  const imgMuddy  = await upload("https://upload.wikimedia.org/wikipedia/commons/c/ce/Muddy_Waters_november_1976.jpg", "Muddy Waters");
  const imgBBKing = await upload("https://upload.wikimedia.org/wikipedia/commons/a/a7/Bbking.jpg", "B.B. King");

  const bluesId = await createCtx({
    title: "Blues",
    slug: "blues",
    color: hex("#1565C0"),
    soft_start_year: 1900,
    is_concluded: false,
    featured_image: img(imgBessie),
    description: dast(
      "Nato nelle comunità afroamericane del Deep South agli albori del Novecento, il blues è il fondamento emotivo di tutta la musica popolare moderna. Le sue radici affondano nelle canzoni di lavoro, negli spiritual e nel dolore dei campi di cotone del Mississippi.",
      "Con il suo schema a 12 battute e la blue note — quella nota sbagliata che fa male in modo giusto — il blues divenne la lingua universale della sofferenza e della resilienza. Artisti come Bessie Smith, Robert Johnson e Muddy Waters lo trasportarono dal Delta al mondo intero."
    ),
  });

  await createEv({ title: "Mamie Smith registra Crazy Blues", slug: "mamie-smith-crazy-blues", context: bluesId, year: 1920, visibility: "super", event_type: "key_moment",
    description: dast("Il 10 agosto 1920 Mamie Smith registra Crazy Blues per Okeh Records: è il primo blues commercialmente pubblicato da una cantante afroamericana. Vende oltre un milione di copie in pochi mesi e lancia l'industria dei race records, aprendo le porte a decenni di musica nera registrata.") });

  await createEv({ title: "Bessie Smith — Downhearted Blues", slug: "bessie-smith-downhearted-blues", context: bluesId, year: 1923, visibility: "super", event_type: "key_moment",
    featured_image: img(imgBessie),
    description: dast("Bessie Smith registra Downhearted Blues e diventa in pochi mesi la cantante di blues più venduta d'America. La sua voce possente e la sua presenza scenica le valgono il titolo di Empress of the Blues. Le sue registrazioni tra il 1923 e il 1933 rimangono tra le più potenti della storia del genere.") });

  await createEv({ title: "Robert Johnson — Sessioni di Dallas", slug: "robert-johnson-dallas-sessions", context: bluesId, year: 1936, visibility: "super", event_type: "key_moment",
    description: dast("Nel novembre 1936 Robert Johnson si reca a Dallas per la sua prima sessione con l'American Record Corporation. In due sessioni produce 29 canzoni: l'intera eredità registrata del Re del Delta Blues. Le sue tracce influenzeranno Eric Clapton, Keith Richards e generazioni di musicisti. Johnson muore nel 1938 a soli 27 anni.") });

  await createEv({ title: "Muddy Waters elettrifica il blues a Chicago", slug: "muddy-waters-chicago", context: bluesId, year: 1948, visibility: "main", event_type: "key_moment",
    featured_image: img(imgMuddy),
    description: dast("Muddy Waters porta il blues del Delta a Chicago e lo elettrifica con chitarra amplificata, basso e batteria. Le sue registrazioni per Chess Records tra il 1948 e il 1960 reinventano il blues come musica urbana e aprono la strada al rock and roll. Rolling Stones e Led Zeppelin lo citeranno come influenza primaria.") });

  await createEv({ title: "B.B. King — 3 O'Clock Blues", slug: "bb-king-3-oclock-blues", context: bluesId, year: 1951, visibility: "main", event_type: "key_moment",
    featured_image: img(imgBBKing),
    description: dast("B.B. King registra 3 O'Clock Blues che raggiunge la vetta delle classifiche R&B. Con la sua chitarra Lucille e il vibrato inconfondibile, King diventa l'ambasciatore del blues nel mondo, portandolo nei teatri e nelle radio di tutto il pianeta per oltre sessant'anni di carriera.") });

  // ── JAZZ ───────────────────────────────────────────────────────────────────
  console.log("\n🎷 JAZZ");
  const imgArmstrong = await upload("https://upload.wikimedia.org/wikipedia/commons/c/c5/Louis_Armstrong_%281955%29.jpg", "Louis Armstrong");
  const imgEllington = await upload("https://upload.wikimedia.org/wikipedia/commons/a/af/Duke_Ellington_-_publicity.JPG", "Duke Ellington");
  const imgParker    = await upload("https://upload.wikimedia.org/wikipedia/commons/8/82/Portrait_of_Charlie_Parker_in_1947.jpg", "Charlie Parker");
  const imgDavis     = await upload("https://upload.wikimedia.org/wikipedia/commons/2/24/Miles_Davis_by_Palumbo_cropped.jpg", "Miles Davis");
  const imgColtrane  = await upload("https://upload.wikimedia.org/wikipedia/commons/1/14/John_Coltrane_1963_cropped_ver2.jpg", "John Coltrane");

  const jazzId = await createCtx({
    title: "Jazz",
    slug: "jazz",
    color: hex("#D97706"),
    soft_start_year: 1895,
    is_concluded: false,
    featured_image: img(imgArmstrong),
    description: dast(
      "Emerso a New Orleans agli albori del Novecento dalla fusione di blues, ragtime, musica da banda e influenze caraibiche, il jazz è la prima grande arte musicale nata in America. La sua essenza è l'improvvisazione: ogni esecuzione è unica, ogni musicista un conversatore che risponde e provoca.",
      "Da Louis Armstrong che trasforma il jazz in spettacolo mondiale, al periodo swing di Duke Ellington, alla rivoluzione bebop di Charlie Parker, fino al jazz modale di Miles Davis e agli astri di John Coltrane: il jazz è la storia di una musica sempre in fuga da se stessa."
    ),
  });

  await createEv({ title: "Louis Armstrong — Hot Five", slug: "louis-armstrong-hot-five", context: jazzId, year: 1925, visibility: "super", event_type: "key_moment",
    featured_image: img(imgArmstrong),
    description: dast("Louis Armstrong forma il suo Hot Five e registra una serie di brani che rivoluzionano il jazz: l'improvvisazione solistica diventa il cuore della musica. West End Blues del 1928 con la sua introduzione a tromba solista è considerato il brano jazz più influente mai registrato. Armstrong è il primo vero divo internazionale del jazz.") });

  await createEv({ title: "Duke Ellington al Cotton Club", slug: "duke-ellington-cotton-club", context: jazzId, year: 1927, visibility: "super", event_type: "key_moment",
    featured_image: img(imgEllington),
    description: dast("Duke Ellington e la sua orchestra prendono residenza al Cotton Club di Harlem. Le trasmissioni radiofoniche in diretta portano il suono jungle sound di Ellington nelle case di tutta l'America. In oltre cinquant'anni di carriera comporrà più di tremila opere, tra cui suite, balletti e musica sacra.") });

  await createEv({ title: "Charlie Parker e la rivoluzione Bebop", slug: "charlie-parker-bebop", context: jazzId, year: 1945, visibility: "super", event_type: "key_moment",
    featured_image: img(imgParker),
    description: dast("Charlie Bird Parker, insieme a Dizzy Gillespie, Thelonious Monk e Kenny Clarke, reinventa il jazz come arte intellettuale. Il bebop è veloce, armonico, difficile: un jazz per ascoltatori seri, non per ballerini. Una rivoluzione che spezza il pubblico e crea il jazz moderno come lo conosciamo.") });

  await createEv({ title: "Miles Davis — Kind of Blue", slug: "miles-davis-kind-of-blue", context: jazzId, year: 1959, visibility: "super", event_type: "key_moment",
    featured_image: img(imgDavis),
    description: dast("Kind of Blue viene registrato in sole due sessioni nel marzo e aprile 1959. Con modalità invece di accordi complessi, Miles Davis, Coltrane, Cannonball Adderley e Bill Evans creano il disco jazz più venduto di sempre. Un capolavoro assoluto di semplicità, spazio e bellezza.") });

  await createEv({ title: "John Coltrane — A Love Supreme", slug: "john-coltrane-a-love-supreme", context: jazzId, year: 1964, visibility: "main", event_type: "key_moment",
    featured_image: img(imgColtrane),
    description: dast("A Love Supreme è il testamento spirituale di John Coltrane: quattro movimenti dedicati a Dio, registrati in un'unica sessione il 9 dicembre 1964. Acknowledgement, Resolution, Pursuance, Psalm — è il disco jazz più amato della storia. Coltrane morirà tre anni dopo a soli quarant'anni.") });

  // ── ROCK & ROLL ────────────────────────────────────────────────────────────
  console.log("\n🎸 ROCK & ROLL");
  const imgElvis   = await upload("https://upload.wikimedia.org/wikipedia/commons/9/99/Elvis_Presley_promoting_Jailhouse_Rock.jpg", "Elvis Presley");
  const imgChuck   = await upload("https://upload.wikimedia.org/wikipedia/commons/2/20/Chuck_Berry_1957.jpg", "Chuck Berry");
  const imgBeatles = await upload("https://upload.wikimedia.org/wikipedia/commons/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg", "The Beatles");
  const imgHendrix = await upload("https://upload.wikimedia.org/wikipedia/commons/a/aa/Jimi_Hendrix_%281967%29_%28cropped%29.jpg", "Jimi Hendrix");

  const rockId = await createCtx({
    title: "Rock & Roll",
    slug: "rock-and-roll",
    color: hex("#DC2626"),
    soft_start_year: 1950,
    is_concluded: false,
    featured_image: img(imgElvis),
    description: dast(
      "Il rock and roll esplode a meta degli anni 50 come la prima musica veramente adolescente: elettrica, provocatoria, irresistibile. Nato dall'incontro tra il rhythm and blues afroamericano e la country music del Sud, prende forma nelle mani di Chuck Berry, Little Richard ed Elvis Presley.",
      "Con la British Invasion dei Beatles nel 1964 il rock diventa un fenomeno globale e si moltiplica in decine di sottogeneri: psichedelia, hard rock, punk, heavy metal, alternative. Ogni decennio porta una nuova rivoluzione sonora."
    ),
  });

  await createEv({ title: "Chuck Berry — Maybellene", slug: "chuck-berry-maybellene", context: rockId, year: 1955, visibility: "super", event_type: "key_moment",
    featured_image: img(imgChuck),
    description: dast("Maybellene di Chuck Berry entra nelle classifiche pop e R&B nell'estate del 1955. Berry inventa la forma-canzone del rock: riff di chitarra, testo narrativo, energia adolescente. John Lennon dichiaro: se dovessi dare un altro nome al rock and roll, lo chiamerei Chuck Berry.") });

  await createEv({ title: "Elvis Presley — Heartbreak Hotel", slug: "elvis-presley-heartbreak-hotel", context: rockId, year: 1956, visibility: "super", event_type: "key_moment",
    featured_image: img(imgElvis),
    description: dast("Heartbreak Hotel entra al numero 1 il 21 aprile 1956 e rimane lì per sette settimane. Le esibizioni televisive di Elvis con i fianchi che ondeggiano scandalizzano l'America adulta e mandano in delirio i teenager. Il Re ridisegna i confini della musica popolare e della cultura giovanile americana.") });

  await createEv({ title: "The Beatles — British Invasion", slug: "the-beatles-british-invasion", context: rockId, year: 1964, visibility: "super", event_type: "key_moment",
    featured_image: img(imgBeatles),
    description: dast("Il 9 febbraio 1964 i Beatles appaiono all'Ed Sullivan Show davanti a 73 milioni di telespettatori. La British Invasion cambia per sempre la musica americana e globale. Lennon, McCartney, Harrison e Starr riscrivono le regole della canzone pop e dell'album come opera d'arte collettiva.") });

  await createEv({ title: "Jimi Hendrix — Are You Experienced", slug: "jimi-hendrix-are-you-experienced", context: rockId, year: 1967, visibility: "super", event_type: "key_moment",
    featured_image: img(imgHendrix),
    description: dast("Il debut album di Jimi Hendrix ridefinisce cosa puo fare una chitarra elettrica. Hendrix brucia la sua Stratocaster a Monterey nel giugno 1967 e diventa una leggenda. La sua tecnica — feedback, whammy bar, distorsione — è ancora il punto di riferimento assoluto per ogni chitarrista rock.") });

  await createEv({ title: "Led Zeppelin — Album di debutto", slug: "led-zeppelin-debut", context: rockId, year: 1969, visibility: "main", event_type: "key_moment",
    description: dast("Il 12 gennaio 1969 i Led Zeppelin pubblicano il loro album omonimo, registrato in soli 36 ore. Plant, Page, Jones e Bonham fondono blues, folk e potenza devastante inventando l'hard rock. Uno dei debutti piu folgoranti nella storia del rock.") });

  // ── SOUL & R&B ─────────────────────────────────────────────────────────────
  console.log("\n🎤 SOUL & R&B");
  const imgAretha = await upload("https://upload.wikimedia.org/wikipedia/commons/c/c6/Aretha_Franklin_1968.jpg", "Aretha Franklin");
  const imgRay    = await upload("https://upload.wikimedia.org/wikipedia/commons/e/e8/Ray_Charles_classic_piano_pose.jpg", "Ray Charles");
  const imgJames  = await upload("https://upload.wikimedia.org/wikipedia/commons/b/b0/James_Brown_Jan_1970_publicity_photo.png", "James Brown");
  const imgMarvin = await upload("https://upload.wikimedia.org/wikipedia/commons/0/03/Marvin_Gaye_%281973_publicity_photo%29.jpg", "Marvin Gaye");

  const soulId = await createCtx({
    title: "Soul & R&B",
    slug: "soul-rb",
    color: hex("#7C3AED"),
    soft_start_year: 1954,
    is_concluded: false,
    featured_image: img(imgAretha),
    description: dast(
      "Il soul nasce dalla fusione dello spiritual gospel con il ritmo del rhythm and blues, portando la chiesa nella strada. Ray Charles è il primo a fondere questi mondi con audacia scandalosa negli anni 50.",
      "La Motown di Berry Gordy trasforma Detroit nella Hitsville USA portando artisti neri nelle classifiche pop. Aretha Franklin, James Brown e Marvin Gaye portano il soul alla massima intensita emotiva e politica tra gli anni 60 e 70."
    ),
  });

  await createEv({ title: "Ray Charles — I Got a Woman", slug: "ray-charles-i-got-a-woman", context: soulId, year: 1954, visibility: "super", event_type: "key_moment",
    featured_image: img(imgRay),
    description: dast("Ray Charles registra I Got a Woman mescolando gospel e R&B in modo che scandalizza le chiese afroamericane ma conquista le radio. E il momento zero del soul: la voce di Dio che canta dell'amore terreno. Charles è cieco dalla nascita, ma la sua visione musicale non conosce limiti.") });

  await createEv({ title: "Fondazione della Motown Records", slug: "motown-records-fondazione", context: soulId, year: 1959, visibility: "main", event_type: "key_moment",
    description: dast("Berry Gordy fonda la Tamla Motown a Detroit con un prestito di 800 dollari. In pochi anni l'etichetta diventa la piu importante d'America per artisti afroamericani: The Supremes, The Temptations, Stevie Wonder, Marvin Gaye. La Motown Sound conquista le classifiche bianche e nere insieme.") });

  await createEv({ title: "James Brown — Papa's Got a Brand New Bag", slug: "james-brown-papas-got-a-brand-new-bag", context: soulId, year: 1965, visibility: "super", event_type: "key_moment",
    featured_image: img(imgJames),
    description: dast("Papa's Got a Brand New Bag segna la nascita del funk: ritmo sul primo tempo, chitarra sincopata, fiati come percussioni. James Brown — l'Hardest Working Man in Show Business — inventa la musica da ballo piu fisica e politica del Novecento. Say it loud, I'm Black and I'm proud.") });

  await createEv({ title: "Aretha Franklin — Respect", slug: "aretha-franklin-respect", context: soulId, year: 1967, visibility: "super", event_type: "key_moment",
    featured_image: img(imgAretha),
    description: dast("Respect di Aretha Franklin — reinterpretazione di un brano di Otis Redding — entra al numero 1 nell'estate del 1967 e diventa immediatamente un inno del movimento per i diritti civili e del femminismo. Aretha, Queen of Soul, vince 18 Grammy Award in carriera, piu di qualsiasi altra artista femminile.") });

  await createEv({ title: "Marvin Gaye — What's Going On", slug: "marvin-gaye-whats-going-on", context: soulId, year: 1971, visibility: "super", event_type: "key_moment",
    featured_image: img(imgMarvin),
    description: dast("What's Going On e l'album con cui Marvin Gaye eleva il soul a coscienza politica: la guerra del Vietnam, la poverta urbana, il degrado ambientale cantati con arrangiamenti orchestrali di straordinaria bellezza. La Motown non voleva pubblicarlo. Fu il disco piu venduto dell'anno.") });

  // ── HIP-HOP ────────────────────────────────────────────────────────────────
  console.log("\n🎤 HIP-HOP");
  const imgHerc   = await upload("https://upload.wikimedia.org/wikipedia/commons/0/06/Kool_Herc.jpg", "DJ Kool Herc");
  const imgFlash  = await upload("https://upload.wikimedia.org/wikipedia/commons/c/c3/Grandmaster_Flash_-_James_Lavelle%27s_Meltdown_Festival_2014_%28cropped%29.jpg", "Grandmaster Flash");
  const imgRunDMC = await upload("https://upload.wikimedia.org/wikipedia/commons/e/ee/Run_DMC_%28cropped%29.png", "Run-DMC");

  const hipHopId = await createCtx({
    title: "Hip-Hop",
    slug: "hip-hop",
    color: hex("#EA580C"),
    soft_start_year: 1973,
    is_concluded: false,
    featured_image: img(imgHerc),
    description: dast(
      "L'11 agosto 1973 al 1520 di Sedgwick Avenue nel Bronx, DJ Kool Herc inventa il breakbeat isolando e ripetendo la parte ritmica del disco. In un quartiere devastato da poverta e criminalita, nasce una cultura complessa: DJing, rapping, breakdance e graffiti art.",
      "Dal Bronx al mondo intero in vent'anni: il Sugarhill Gang porta l'hip-hop nelle classifiche, Grandmaster Flash porta il messaggio politico, Run-DMC abbatte le barriere tra generi. Negli anni 90 diventa la musica piu ascoltata del pianeta."
    ),
  });

  await createEv({ title: "DJ Kool Herc — La Prima Festa", slug: "dj-kool-herc-prima-festa", context: hipHopId, year: 1973, month: 8, day: 11, visibility: "super", event_type: "key_moment",
    featured_image: img(imgHerc),
    description: dast("L'11 agosto 1973 Clive DJ Kool Herc Campbell organizza una festa nel seminterrato del condominio al 1520 di Sedgwick Avenue nel West Bronx. Usando due copie dello stesso disco prolunga il break — la parte strumentale ritmica — inventando il breakbeat, base di tutta la musica hip-hop.") });

  await createEv({ title: "Sugarhill Gang — Rapper's Delight", slug: "sugarhill-gang-rappers-delight", context: hipHopId, year: 1979, visibility: "super", event_type: "key_moment",
    description: dast("Rapper's Delight del Sugarhill Gang e il primo singolo hip-hop a raggiungere le classifiche mainstream: 15 minuti di rapping su un campionamento di Good Times degli Chic. Introduce l'hip-hop al mondo e vende oltre 8 milioni di copie. Il rap diventa industria discografica.") });

  await createEv({ title: "Grandmaster Flash — The Message", slug: "grandmaster-flash-the-message", context: hipHopId, year: 1982, visibility: "super", event_type: "key_moment",
    featured_image: img(imgFlash),
    description: dast("Don't push me cause I'm close to the edge: The Message di Grandmaster Flash e the Furious Five e il primo grande brano hip-hop di denuncia sociale. Descrive la vita nel ghetto con un realismo mai sentito prima nella musica popolare. Rolling Stone lo inserisce tra i 500 migliori dischi di sempre.") });

  await createEv({ title: "Run-DMC — Raising Hell", slug: "run-dmc-raising-hell", context: hipHopId, year: 1986, visibility: "main", event_type: "key_moment",
    featured_image: img(imgRunDMC),
    description: dast("Raising Hell e la collaborazione con gli Aerosmith su Walk This Way abbattono il muro tra hip-hop e rock, portando il genere nelle radio rock e nei canali MTV. Run-DMC e il primo gruppo hip-hop sulla copertina di Rolling Stone. Le loro Adidas senza lacci diventano un'icona di stile globale.") });

  await createEv({ title: "Public Enemy — It Takes a Nation of Millions", slug: "public-enemy-it-takes-a-nation", context: hipHopId, year: 1988, visibility: "main", event_type: "key_moment",
    description: dast("It Takes a Nation of Millions to Hold Us Back di Public Enemy e il manifesto politico dell'hip-hop: wall of sound, sample sovrapposti, liriche di denuncia radicale. Chuck D e Flavor Flav trasformano l'hip-hop in arma politica. Rolling Stone lo chiama il disco piu importante degli anni 80.") });

  // ── MUSICA ELETTRONICA ─────────────────────────────────────────────────────
  console.log("\n🎛️  MUSICA ELETTRONICA");
  const imgKraftwerk = await upload("https://upload.wikimedia.org/wikipedia/commons/8/8c/Kraftwerk_1975_%28cropped%29.jpg", "Kraftwerk");
  const imgMoroder   = await upload("https://upload.wikimedia.org/wikipedia/commons/2/2d/Giorgio_Moroder_-_First_Avenue_Minneapolis_-_The_Current_%2844776142702%29.jpg", "Giorgio Moroder");

  const electroId = await createCtx({
    title: "Musica Elettronica",
    slug: "musica-elettronica",
    color: hex("#0891B2"),
    soft_start_year: 1970,
    is_concluded: false,
    featured_image: img(imgKraftwerk),
    description: dast(
      "La musica elettronica nasce nei laboratori sperimentali degli anni 50 — Stockhausen a Colonia, Schaeffer a Parigi — ma e negli anni 70 che trova la sua voce popolare. Kraftwerk di Dusseldorf costruisce con sintetizzatori e drum machine un'estetica del futuro.",
      "Giorgio Moroder unisce sintetizzatori e dancefloor nel 1977. Chicago vede nascere la house music, Detroit risponde con il techno. Dagli anni 80 l'elettronica diventa il motore nascosto di quasi tutta la musica popolare mondiale."
    ),
  });

  await createEv({ title: "Kraftwerk — Autobahn", slug: "kraftwerk-autobahn", context: electroId, year: 1974, visibility: "super", event_type: "key_moment",
    featured_image: img(imgKraftwerk),
    description: dast("Autobahn e un viaggio di 22 minuti in autostrada fatto di sintetizzatori, vocoder e ritmo meccanico. Kraftwerk — Ralf Hutter e Florian Schneider — inventano una musica senza chitarre, senza blues, senza passato. Un futuro che suona ancora moderno cinquant'anni dopo.") });

  await createEv({ title: "Giorgio Moroder — I Feel Love", slug: "giorgio-moroder-i-feel-love", context: electroId, year: 1977, visibility: "super", event_type: "key_moment",
    featured_image: img(imgMoroder),
    description: dast("I Feel Love di Donna Summer, prodotta dal trentacinquenne Giorgio Moroder di Urtijei in Alto Adige, e il primo hit disco con backing track completamente sintetizzato. Brian Eno la defini il futuro della musica da ballo. House, techno, trance, EDM: tutto parte da qui, da un produttore italiano.") });

  await createEv({ title: "Frankie Knuckles — House Music a Chicago", slug: "frankie-knuckles-house-chicago", context: electroId, year: 1984, visibility: "super", event_type: "key_moment",
    description: dast("Al Warehouse e poi al Power Plant di Chicago, Frankie Knuckles — il Godfather of House — mixando disco, R&B e ritmi elettronici inventa la house music. Il nome del genere viene proprio dal Warehouse. La house di Chicago ispira le scene dance di tutto il mondo negli anni 80 e 90.") });

  await createEv({ title: "Detroit Techno — Le Belleville Three", slug: "detroit-techno-belleville-three", context: electroId, year: 1987, visibility: "main", event_type: "key_moment",
    description: dast("Juan Atkins, Derrick May e Kevin Saunderson — tre amici cresciuti a Belleville, Michigan — creano il Detroit techno: freddo, futurista, industriale. Strings of Life di Derrick May del 1987 e ancora oggi considerato il brano techno piu influente mai realizzato. Il suono di Detroit diventa la colonna sonora dell'Europa degli anni 90.") });

  await createEv({ title: "Daft Punk — Homework", slug: "daft-punk-homework", context: electroId, year: 1997, visibility: "main", event_type: "key_moment",
    description: dast("Around the World e Da Funk dall'album Homework portano la French House nelle classifiche mondiali. Daft Punk — Thomas Bangalter e Guy-Manuel de Homem-Christo — fondono house, funk e pop con un'estetica robotica e iconografica. Da Discovery del 2001 a Random Access Memories del 2013, ridefiniscono la musica elettronica come arte popolare.") });

  console.log("\n✅ Seed completato! 6 contesti, 30 eventi.");
}

main().catch(e => {
  console.error("Errore:", e);
  process.exit(1);
});
