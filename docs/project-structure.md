# Project Structure

## Directory Tree

```
trama/
  app/
    timeline/[slug]/page.tsx    # Timeline page (SSR, fetches from DatoCMS)
    page.tsx                     # Homepage
  components/
    detail/                      # Event detail panel
    home/                        # Homepage components
    sidebar/                     # Sidebar tree navigation
    timeline/                    # Timeline canvas, bars, markers, axis
      GhostBars.tsx              # Semi-transparent sibling timeline bars
      SubTimelineBars.tsx        # Child sub-timeline colored bars
      TimelineAxis.tsx           # Axis with tick marks and labels
      TimelineCanvas.tsx         # Main canvas orchestrator (zoom, pan, viewport)
      SuperEventMarker.tsx       # Event card markers
  lib/
    datocms/
      client.ts                  # DatoCMS API client
      fragments.ts               # GraphQL fragments
      queries.ts                 # GraphQL queries (tree, slug, children, promoted)
    timeline/
      child-events.ts            # Child event utilities
      collision.ts               # Card collision detection
      date-utils.ts              # eventToFractionalYear, formatTimelineDate, computeTimelineRange
      drag-context.ts            # Drag & drop state
      scale.ts                   # yearToPixel, pixelToYear, getAxisLabels, computeFitToView
      tree-utils.ts              # computeTreeRanges, findNodeInTree, getSiblings, buildParentMap
      visibility.ts              # Zoom-level visibility thresholds
    types.ts                     # NodeBase, NodeTree, NodeSummary, NodeDetail, etc.
  scripts/
    seed.ts                      # Generic seed script (reads JSON, creates DatoCMS nodes)
    seed-format.json             # JSON format documentation with example
    data/                        # Seed JSON data files (generated per-timeline)
    seed-napoleone.ts            # One-off seed (Napoleone, historical)
    seed-garibaldi.ts            # One-off seed (Garibaldi, historical)
    seed-karate.ts               # One-off seed (Karate, historical)
  docs/
    change-log.md                # Release changelog
    project-structure.md         # This file
    shaping/                     # Shaping documents
    pitches/                     # Pitch documents
    design/                      # Design documents
  .claude/
    skills/
      trama-seed/skill.md        # Skill for seeding timelines on DatoCMS
```

## Key Architectural Concepts

| Concept | Description |
|---------|-------------|
| **Node** | Unified DatoCMS model (`JbziKHLoTUCdJCdTZwWWlg`). Every item is a node — timelines, sub-timelines, and events are all nodes with parent/child relationships. |
| **NodeBase** | Base type with id, title, slug, color, year, month, day, endYear, toPresent, visibility, eventType |
| **NodeTree** | NodeBase + description, featuredImage, children[] — used for sidebar and tree computations |
| **Fractional year** | `eventToFractionalYear()` converts year/month/day into a decimal (e.g., June 15 1815 = 1815.4548) |
| **pixelsPerYear (ppy)** | Zoom scale. Higher = more zoomed in. Range: ~0 to 5000. |
| **computedMin/computedMax** | Soft range computed bottom-up from descendants. Used when a node has no explicit endYear. |
| **Visibility** | `super` (always shown), `main` (shown at medium zoom), `regular` (shown at high zoom) |

## DatoCMS Node Fields

| Field | Type | Notes |
|-------|------|-------|
| title | string | |
| slug | string | Unique, kebab-case, ASCII |
| year | integer | Required |
| month | integer (1-12) | Optional, for sub-year positioning |
| day | integer (1-31) | Optional |
| end_year | integer | Optional |
| color | color (hex) | Optional, inherited from parent |
| visibility | enum | regular, main, super |
| event_type | enum | event, incident, key_moment |
| parent_id | link | Parent node |
| description | structured text (DAST) | |
| featured_image | file | |
