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
  console.log(`  ✓ nodo: ${fields.title} (${fields.year})`);
  return item.id;
}

function img(id: string | null) {
  return id ? { upload_id: id } : null;
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {

  // ── NODO RADICE ─────────────────────────────────────────────────────────
  console.log("\n🇮🇹 GIUSEPPE GARIBALDI (nodo radice)");
  const imgGaribaldiRoot = await upload("https://upload.wikimedia.org/wikipedia/commons/7/7b/Garibaldi_%281866%29.jpg", "Giuseppe Garibaldi");

  const rootId = await createNode({
    title: "Giuseppe Garibaldi",
    slug: "giuseppe-garibaldi",
    color: hex("#7C3AED"),
    year: 1807,
    end_year: 1882,
    concluded: true,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgGaribaldiRoot),
    description: dast(
      "Giuseppe Garibaldi (Nizza, 4 luglio 1807 — Caprera, 2 giugno 1882) e' stato un generale, politico e patriota italiano, protagonista del Risorgimento e considerato uno dei padri della patria.",
      "Questa timeline esplora la sua vita attraverso cinque periodi fondamentali."
    ),
  });

  // ── L'ITALIA PRE-UNITARIA ───────────────────────────────────────────────
  console.log("\n🗺️  L'ITALIA PRE-UNITARIA");
  const imgViennaMap = await upload("https://upload.wikimedia.org/wikipedia/commons/a/ac/Europe_1815_map_en.png", "Europa 1815");

  const ctx1Id = await createNode({
    title: "L'Italia pre-unitaria",
    slug: "italia-pre-unitaria",
    parent_id: rootId,
    color: hex("#475569"),
    year: 1800,
    end_year: 1861,
    concluded: true,
    visibility: "super",
    event_type: "event",
    featured_image: img(imgViennaMap),
    description: dast("Nei primi decenni dell'Ottocento l'Italia e' un mosaico di stati divisi."),
  });

  await createNode({
    title: "Congresso di Vienna",
    slug: "congresso-di-vienna-1815",
    parent_id: ctx1Id,
    year: 1815,
    visibility: "super",
    event_type: "key_moment",
    featured_image: img(imgViennaMap),
    description: dast("Le grandi potenze ridisegnano la carta dell'Europa dopo Napoleone."),
  });

  await createNode({
    title: "Mazzini fonda la Giovine Italia",
    slug: "mazzini-giovine-italia-1831",
    parent_id: ctx1Id,
    year: 1831,
    visibility: "super",
    event_type: "key_moment",
    description: dast("Giuseppe Mazzini fonda la Giovine Italia a Marsiglia."),
  });

  console.log("\n✅ Seed di esempio completato!");
}

main().catch(e => {
  console.error("Errore:", e);
  process.exit(1);
});
