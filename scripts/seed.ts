/**
 * seed.ts — Script generico per creare nodi su DatoCMS da un file JSON.
 *
 * Uso:
 *   DATOCMS_API_TOKEN=xxx npx tsx scripts/seed.ts path/to/data.json
 *
 * Il file JSON deve rispettare il formato documentato in scripts/seed-format.json
 */

import { buildClient } from "@datocms/cma-client-node";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Config ───────────────────────────────────────────────────────────────────

const client = buildClient({ apiToken: process.env.DATOCMS_API_TOKEN ?? "" });
const NODE_MODEL = "JbziKHLoTUCdJCdTZwWWlg";

// ── Types ────────────────────────────────────────────────────────────────────

interface SeedNode {
  title: string;
  slug: string;
  year: number;
  end_year?: number;
  month?: number;
  day?: number;
  color?: string;
  visibility?: "regular" | "main" | "super";
  event_type?: "event" | "incident" | "key_moment";
  description?: string[];
  image_url?: string;
  image_title?: string;
  children?: SeedNode[];
}

interface SeedFile {
  parent_id?: string | null;
  nodes: SeedNode[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hex(h: string) {
  return {
    red: parseInt(h.slice(1, 3), 16),
    green: parseInt(h.slice(3, 5), 16),
    blue: parseInt(h.slice(5, 7), 16),
    alpha: 255,
  };
}

function dast(paragraphs: string[]) {
  return {
    schema: "dast",
    document: {
      type: "root",
      children: paragraphs.map((p) => ({
        type: "paragraph",
        children: [{ type: "span", value: p }],
      })),
    },
  };
}

async function uploadImage(url: string, title: string): Promise<string | null> {
  try {
    const u = await client.uploads.createFromUrl({
      url,
      filename: url.split("/").pop()!.split("?")[0],
      skipCreationIfAlreadyExists: true,
      default_field_metadata: {
        en: { title, alt: title, custom_data: {}, focal_point: null },
      },
    });
    console.log(`    ✓ upload: ${title}`);
    return u.id;
  } catch (e: unknown) {
    console.warn(`    ✗ upload fallita "${title}": ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function createRecord(fields: Record<string, unknown>): Promise<string> {
  const item = await client.items.create({
    item_type: { type: "item_type", id: NODE_MODEL },
    ...fields,
  });
  await client.items.publish(item.id);
  return item.id;
}

// ── Core: crea un nodo e ricorsivamente i suoi figli ─────────────────────────

let stats = { nodes: 0, images: 0, imagesFailed: 0 };

async function createNodeTree(node: SeedNode, parentId: string | null, depth: number): Promise<void> {
  const indent = "  ".repeat(depth);
  console.log(`${indent}→ ${node.title} (${node.year}${node.end_year ? "–" + node.end_year : ""})`);

  // Upload immagine se presente
  let imageId: string | null = null;
  if (node.image_url) {
    imageId = await uploadImage(node.image_url, node.image_title ?? node.title);
    if (imageId) stats.images++;
    else stats.imagesFailed++;
  }

  // Costruisci i campi del record
  const fields: Record<string, unknown> = {
    title: node.title,
    slug: node.slug,
    year: node.year,
    visibility: node.visibility ?? "main",
    event_type: node.event_type ?? "event",
  };

  if (parentId) fields.parent_id = parentId;
  if (node.end_year !== undefined) fields.end_year = node.end_year;
  if (node.month !== undefined) fields.month = node.month;
  if (node.day !== undefined) fields.day = node.day;
  if (node.color) fields.color = hex(node.color);
  if (node.description && node.description.length > 0) fields.description = dast(node.description);
  if (imageId) fields.featured_image = { upload_id: imageId };

  const recordId = await createRecord(fields);
  stats.nodes++;
  console.log(`${indent}  ✓ creato (id: ${recordId})`);

  // Ricorsione sui figli
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      await createNodeTree(child, recordId, depth + 1);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Uso: DATOCMS_API_TOKEN=xxx npx tsx scripts/seed.ts <file.json>");
    process.exit(1);
  }

  const fullPath = resolve(jsonPath);
  console.log(`\n📄 Lettura: ${fullPath}`);

  const raw = readFileSync(fullPath, "utf-8");
  const data: SeedFile = JSON.parse(raw);

  const parentId = data.parent_id ?? null;
  if (parentId) {
    console.log(`📌 Parent: ${parentId}`);
  } else {
    console.log("📌 Nodi alla root (homepage)");
  }

  console.log(`📊 Nodi di primo livello: ${data.nodes.length}\n`);

  for (const node of data.nodes) {
    await createNodeTree(node, parentId, 0);
  }

  console.log(`\n✅ Seed completato!`);
  console.log(`   ${stats.nodes} nodi creati`);
  console.log(`   ${stats.images} immagini caricate`);
  if (stats.imagesFailed > 0) {
    console.log(`   ${stats.imagesFailed} immagini fallite`);
  }
}

main().catch((e) => {
  console.error("Errore:", e);
  process.exit(1);
});
