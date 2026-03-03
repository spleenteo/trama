import { buildClient } from "@datocms/cma-client-node";

const client = buildClient({ apiToken: process.env.DATOCMS_API_TOKEN ?? "" });

const CONTEXT_MODEL = "OdF30qLZRyWRfVMi_8lTjg";
const EVENT_MODEL = "Vg_FXz7USqmlzYQl8sMKVw";
const NODE_MODEL = "JbziKHLoTUCdJCdTZwWWlg";

async function listAll(type: string) {
  const items: Record<string, unknown>[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const page = await client.items.list({
      filter: { type },
      page: { limit, offset },
      version: "published",
    });
    items.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }
  return items;
}

async function main() {
  console.log("\n📦 Migrating data to Node model...");

  // Read all contexts and events
  const allContexts = await listAll(CONTEXT_MODEL);
  console.log(`  Found ${allContexts.length} contexts`);

  const allEvents = await listAll(EVENT_MODEL);
  console.log(`  Found ${allEvents.length} events`);

  // Map old context ID → new node ID
  const ctxMap = new Map<string, string>();

  // Sort: roots first, then children
  const roots = allContexts.filter((c) => !c.parent_id);
  const children = allContexts.filter((c) => c.parent_id);

  // Create root context nodes
  for (const ctx of roots) {
    const nodeItem = await client.items.create({
      item_type: { type: "item_type", id: NODE_MODEL },
      title: ctx.title as string,
      slug: ctx.slug as string,
      description: ctx.description ?? undefined,
      featured_image: ctx.featured_image ?? undefined,
      media: ctx.media ?? undefined,
      year: (ctx.soft_start_year as number) ?? 0,
      end_year: ctx.soft_end_year ?? undefined,
      color: ctx.color ?? undefined,
      visibility: "super",
      event_type: "event",
    });
    await client.items.publish(nodeItem.id);
    ctxMap.set(ctx.id, nodeItem.id);
    console.log(`  ✓ root: ${ctx.title} → ${nodeItem.id}`);
  }

  // Create child context nodes
  for (const ctx of children) {
    const parentNodeId = ctxMap.get(ctx.parent_id as string);
    if (!parentNodeId) {
      console.warn(`  ✗ Skip child ${ctx.title}: parent not found`);
      continue;
    }
    const nodeItem = await client.items.create({
      item_type: { type: "item_type", id: NODE_MODEL },
      title: ctx.title as string,
      slug: ctx.slug as string,
      description: ctx.description ?? undefined,
      featured_image: ctx.featured_image ?? undefined,
      media: ctx.media ?? undefined,
      year: (ctx.soft_start_year as number) ?? 0,
      end_year: ctx.soft_end_year ?? undefined,
      color: ctx.color ?? undefined,
      visibility: "super",
      event_type: "event",
      parent_id: parentNodeId,
    });
    await client.items.publish(nodeItem.id);
    ctxMap.set(ctx.id, nodeItem.id);
    console.log(`  ✓ child: ${ctx.title} → ${nodeItem.id}`);
  }

  // Create event nodes
  const evMap = new Map<string, string>();
  const relatedPairs: Array<{ newId: string; oldRelatedIds: string[] }> = [];

  for (const ev of allEvents) {
    const parentNodeId = ctxMap.get(ev.context as string);
    if (!parentNodeId) {
      console.warn(`  ✗ Skip event ${ev.title}: context not mapped`);
      continue;
    }

    const nodeItem = await client.items.create({
      item_type: { type: "item_type", id: NODE_MODEL },
      title: ev.title as string,
      slug: ev.slug as string,
      description: ev.description ?? undefined,
      featured_image: ev.featured_image ?? undefined,
      media: ev.media ?? undefined,
      year: ev.year as number,
      month: ev.month ?? undefined,
      day: ev.day ?? undefined,
      time: ev.time ?? undefined,
      end_year: ev.end_year ?? undefined,
      end_month: ev.end_month ?? undefined,
      end_day: ev.end_day ?? undefined,
      visibility: (ev.visibility as string) ?? "regular",
      event_type: (ev.event_type as string) ?? "event",
      tags: (ev.tags as string[]) ?? [],
      external_links: ev.external_links ?? undefined,
      custom_fields: ev.custom_fields ?? undefined,
      latitude: ev.latitude ?? undefined,
      longitude: ev.longitude ?? undefined,
      number: ev.number ?? undefined,
      parent_id: parentNodeId,
    });
    await client.items.publish(nodeItem.id);
    evMap.set(ev.id, nodeItem.id);

    const oldRelated = ev.related_events as string[] | undefined;
    if (oldRelated && oldRelated.length > 0) {
      relatedPairs.push({ newId: nodeItem.id, oldRelatedIds: oldRelated });
    }

    console.log(`  ✓ event: ${ev.title} (${ev.year}) → ${nodeItem.id}`);
  }

  // Wire related_nodes
  if (relatedPairs.length > 0) {
    console.log("\n🔗 Wiring related_nodes...");
    for (const { newId, oldRelatedIds } of relatedPairs) {
      const newRelatedIds = oldRelatedIds
        .map((oldId) => evMap.get(oldId))
        .filter((id): id is string => id !== undefined);
      if (newRelatedIds.length > 0) {
        await client.items.update(newId, { related_nodes: newRelatedIds });
        await client.items.publish(newId);
        console.log(`  ✓ related: ${newId} → [${newRelatedIds.join(", ")}]`);
      }
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Contexts: ${ctxMap.size}, Events: ${evMap.size}, Related: ${relatedPairs.length}`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
