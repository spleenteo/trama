# Timeo — Project Memory

## Project Overview
Web timeline explorer built with Next.js + DatoCMS. Read-only MVP.
Project root: `/Users/spleenteo/Sites/Personal Apps/timeo`

## Tech Stack
- Next.js 14+ App Router, TypeScript, Tailwind CSS
- Framer Motion (animations), Zustand (state), @datocms/cda-client, react-datocms
- DatoCMS (headless CMS, GraphQL)

## DatoCMS Schema (created via MCP)
- **Tag** model ID: `Ys2Ty3MBTpa2_Bo2UFjRLA` — fields: name, slug, color
- **Context** model ID: `OdF30qLZRyWRfVMi_8lTjg` — Tree collection, fields: title, slug, description (structured_text), featured_image, media, color, soft_start_year, soft_end_year, is_concluded
- **Event** model ID: `Vg_FXz7USqmlzYQl8sMKVw` — fields: title, slug, context (link→Context), year, month, day, time, end_year, end_month, end_day, description (structured_text), featured_image, media, external_links (json), related_events (links→Event), visibility (enum: regular/main/super), event_type (enum: event/incident/key_moment), tags (links→Tag), custom_fields (json), latitude, longitude, number

## Key MCP Notes
- `structured_text` fields require `validators: { structured_text_blocks: { item_types: [] }, structured_text_links: { item_types: [] } }`
- Use `resource_action_destructive_method_execute` to call API directly (avoids lock file issue in Application Support)
- Never use `create_script` + `execute_script` — causes lock timeout because workspace dir didn't exist

## Project Structure
```
/
├── app/
│   ├── layout.tsx, globals.css, page.tsx
│   └── timeline/[slug]/page.tsx
├── components/
│   ├── home/TimelineCard.tsx
│   ├── timeline/ (Canvas, Axis, Bar, SubTimeline, EventMarker, Cluster, ZoomControls, PresentMarker)
│   ├── sidebar/ (ContextTree, ContextTreeItem)
│   ├── detail/ (EventDetailPanel, ContextDetailHeader, RelatedEventsList)
│   └── shared/ (DatoImage, DatoStructuredText)
├── lib/
│   ├── datocms/ (client.ts, fragments.ts, queries.ts)
│   ├── timeline/ (scale.ts, date-utils.ts, visibility.ts)
│   ├── store/index.ts (Zustand)
│   └── types.ts
├── .env.local (DATOCMS_API_TOKEN set)
└── specs.md, breadboard.md, slices.md (planning docs)
```

## Development Slices (breadboard.md)
- V1: Homepage with TimelineCard grid ← CURRENT
- V2: Timeline page: axis + context header
- V3: Zoom and pan
- V4: Event markers, visibility, clustering
- V5: Sidebar, context tree, sub-timeline bars
- V6: Event Detail Panel

## User Preferences
- Keep everything in the project directory (not ~/Library or other system dirs)
- UI in Italian (labels, comments)
