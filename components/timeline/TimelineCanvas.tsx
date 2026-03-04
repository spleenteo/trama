'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { animate } from 'framer-motion';
import type { ChildEvent, NodeTree, NodeSummary } from '@/lib/types';
import { computeFitToView, pixelToYear } from '@/lib/timeline/scale';
import { computeTimelineRange, eventToFractionalYear } from '@/lib/timeline/date-utils';
import { getVisibleEvents } from '@/lib/timeline/visibility';
import { useTimelineStore } from '@/lib/store';
import ContextDetailHeader from '@/components/detail/ContextDetailHeader';
import TimelineAxis from '@/components/timeline/TimelineAxis';
import ZoomControls from '@/components/timeline/ZoomControls';
import CreateEventModal from '@/components/timeline/CreateEventModal';
import EventCluster, { clusterEvents, type Cluster } from '@/components/timeline/EventCluster';
import SubTimelineBars from '@/components/timeline/SubTimelineBars';
import GhostBars from '@/components/timeline/GhostBars';
import TimelineBar from '@/components/timeline/TimelineBar';
import SuperEventMarker, { SUPER_CARD_W } from '@/components/timeline/SuperEventMarker';
import SuperEventStem from '@/components/timeline/SuperEventStem';
import { getAccentColor } from '@/lib/utils/color';
import { TIMELINE_EASE } from '@/lib/timeline/constants';
import { assignLevels } from '@/lib/timeline/collision';
import { useDrag } from '@/lib/timeline/drag-context';

export interface EventDot {
  year: number;
  visibility: string;
}

interface Props {
  context: NodeTree;
  events: NodeSummary[];
  childEvents?: ChildEvent[];
  initialEventSlug?: string;
  showContextBar?: boolean;
  siblings?: NodeTree[];
  eventDotsMap?: Map<string, EventDot[]>;
}

const ZOOM_FACTOR = 1.4;

const WHEEL_BASE = 1.002; // smooth proportional zoom — ~22% per 100-unit scroll
const MAX_PPY = 400;

// Hard universe bounds — Big Bang to Big Rip
const MIN_YEAR = -13_800_000_000;
const MAX_YEAR =  20_000_000_000;
const UNIVERSE_RANGE = MAX_YEAR - MIN_YEAR; // 33.8 billion years

// Minimum zoom: viewport can never show more than the full universe range
function minPPY(viewportWidth: number): number {
  return viewportWidth / UNIVERSE_RANGE;
}

function clampPPY(ppy: number, viewportWidth: number): number {
  return Math.min(MAX_PPY, Math.max(minPPY(viewportWidth), ppy));
}

function clampVS(vs: number, ppy: number, viewportWidth: number): number {
  const viewportRange = viewportWidth / ppy;
  // If viewport is at max zoom-out, pin to MIN_YEAR
  if (viewportRange >= UNIVERSE_RANGE) return MIN_YEAR;
  return Math.max(MIN_YEAR, Math.min(MAX_YEAR - viewportRange, vs));
}

export default function TimelineCanvas({ context, events, childEvents, initialEventSlug, showContextBar = true, siblings, eventDotsMap }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

  const [viewportStart, setViewportStart] = useState<number>(0);
  const [pixelsPerYear, setPixelsPerYear] = useState<number>(1);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const router = useRouter();

  const vpRef = useRef(viewportStart);
  const ppyRef = useRef(pixelsPerYear);
  vpRef.current = viewportStart;
  ppyRef.current = pixelsPerYear;
  const widthRef = useRef(width);
  widthRef.current = width;

  const setSelectedEvent = useTimelineStore((s) => s.setSelectedEvent);
  const selectedEventId = useTimelineStore((s) => s.selectedEventId);

  const { minYear, maxYear } = computeTimelineRange(
    events,
    context.year,
    context.endYear,
    context.children
  );

  const axisY = canvasHeight > 0 ? canvasHeight / 2 : 48;

  // ─── Fit to view ──────────────────────────────────────────────────────────
  const fitToView = useCallback(
    (w: number = widthRef.current) => {
      if (w <= 0) return;
      const { viewportStart: targetVS, pixelsPerYear: targetPPY } = computeFitToView(minYear, maxYear, w);
      const fromVS = vpRef.current;
      const fromPPY = ppyRef.current;
      if (Math.abs(fromVS - targetVS) < 0.001 && Math.abs(fromPPY - targetPPY) < 0.0001) return;
      animate(0, 1, {
        duration: 0.5,
        ease: [...TIMELINE_EASE],
        onUpdate: (t) => {
          setViewportStart(fromVS + (targetVS - fromVS) * t);
          setPixelsPerYear(fromPPY + (targetPPY - fromPPY) * t);
        },
        onComplete: () => {
          setViewportStart(targetVS);
          setPixelsPerYear(targetPPY);
        },
      });
    },
    [minYear, maxYear]
  );

  // ─── ResizeObserver ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setWidth(rect.width);
      setCanvasHeight(rect.height);
    });
    obs.observe(el);
    const rect = el.getBoundingClientRect();
    setWidth(rect.width);
    setCanvasHeight(rect.height);
    return () => obs.disconnect();
  }, []);

  // Init viewport
  const initialised = useRef(false);
  useEffect(() => {
    if (width > 0 && !initialised.current) {
      const { viewportStart: vs, pixelsPerYear: ppy } = computeFitToView(minYear, maxYear, width);
      setViewportStart(vs);
      setPixelsPerYear(ppy);
      initialised.current = true;
    }
  }, [width, minYear, maxYear]);

  // Init selected event from URL param — run only once on mount.
  // urlInitDone must be set to true unconditionally on first run, even when
  // initialEventSlug is absent. If we returned early before setting the flag,
  // the guard would remain false; later when router.replace() adds ?event=slug
  // the effect would re-fire, call setSelectedEvent (a toggle), and close the panel.
  const urlInitDone = useRef(false);
  useEffect(() => {
    if (urlInitDone.current) return;
    urlInitDone.current = true;
    if (!initialEventSlug) return;
    const match = events.find((e) => e.slug === initialEventSlug);
    if (match) setSelectedEvent(match.id);
  }, [initialEventSlug, events, setSelectedEvent]);

  // ─── Center viewport on selected element ─────────────────────────────────
  type EnrichedChild = NodeTree & { computedMin?: number; computedMax?: number };
  const lastCenteredId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedEventId) { lastCenteredId.current = null; return; }
    if (selectedEventId === lastCenteredId.current) return;
    lastCenteredId.current = selectedEventId;

    let centerYear: number | null = null;

    // Leaf event
    const leafEv = events.find((e) => e.id === selectedEventId);
    if (leafEv) {
      const start = eventToFractionalYear(leafEv);
      const end = leafEv.endYear != null
        ? eventToFractionalYear({ year: leafEv.endYear, month: leafEv.endMonth, day: leafEv.endDay })
        : start;
      centerYear = (start + end) / 2;
    }

    // Sub-context bar (enriched with computedMin/computedMax at runtime)
    if (centerYear == null) {
      const child = (context.children as EnrichedChild[]).find((c) => c.id === selectedEventId);
      if (child) {
        const s = child.computedMin ?? child.year;
        const e = child.computedMax ?? child.endYear ?? child.year;
        centerYear = (s + e) / 2;
      }
    }

    // Promoted child event
    if (centerYear == null) {
      const ce = childEvents?.find((e) => e.id === selectedEventId);
      if (ce) centerYear = eventToFractionalYear(ce);
    }

    // Main context bar
    if (centerYear == null && context.id === selectedEventId) {
      centerYear = (minYear + maxYear) / 2;
    }

    // Sibling bar
    if (centerYear == null) {
      const sib = siblings?.find((s) => s.id === selectedEventId);
      if (sib) centerYear = ((sib.year) + (sib.endYear ?? sib.year)) / 2;
    }

    if (centerYear == null) return;

    const targetVS = clampVS(
      centerYear - widthRef.current / 2 / ppyRef.current,
      ppyRef.current,
      widthRef.current,
    );
    const fromVS = vpRef.current;
    if (Math.abs(fromVS - targetVS) < 0.5 / ppyRef.current) return; // already centered
    animate(0, 1, {
      duration: 0.5,
      ease: [...TIMELINE_EASE],
      onUpdate: (t) => setViewportStart(fromVS + (targetVS - fromVS) * t),
      onComplete: () => setViewportStart(targetVS),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  // ─── Wheel zoom ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorYear = pixelToYear(cursorX, vpRef.current, ppyRef.current);
      // Proportional zoom: small deltaY = small step (smooth trackpad), large deltaY = bigger step (mouse)
      const delta = Math.pow(WHEEL_BASE, -e.deltaY);
      const newPPY = clampPPY(ppyRef.current * delta, widthRef.current);
      setPixelsPerYear(newPPY);
      setViewportStart(clampVS(cursorYear - cursorX / newPPY, newPPY, widthRef.current));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // ─── Event drag & drop (move event to another context) ───────────────────
  const { state: dragState, setDropTarget, endDrag, isDragging: isEventDragging } = useDrag();
  const isEventDraggingRef = useRef(false);
  isEventDraggingRef.current = isEventDragging;

  // Detect drop target under pointer during event drag
  useEffect(() => {
    if (!isEventDragging) return;
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const dropId = (target as Element)?.closest('[data-drop-id]')?.getAttribute('data-drop-id')
        ?? (target as Element)?.getAttribute('data-drop-id');
      setDropTarget(dropId);
    };

    const onUp = async () => {
      const result = endDrag();
      if (result) {
        try {
          const res = await fetch(`/api/nodes/${result.eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent_id: result.targetId }),
          });
          if (res.ok) {
            await new Promise((r) => setTimeout(r, 1500));
            router.refresh();
          }
        } catch (err) {
          console.error('Move failed:', err);
        }
      }
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', () => endDrag());
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', () => endDrag());
    };
  }, [isEventDragging, setDropTarget, endDrag, router]);

  // ─── Pointer drag (pan canvas) ─────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let dragging = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Don't start pan when event drag is active
      if (isEventDraggingRef.current) return;
      // Don't start drag when clicking on interactive controls (buttons, SVG role="button")
      if ((e.target as Element).closest('button, [role="button"]')) return;
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || isEventDraggingRef.current) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      setViewportStart((vs) => clampVS(vs - dx / ppyRef.current, ppyRef.current, widthRef.current));
    };
    const onUp = () => {
      dragging = false;
      if (!isEventDraggingRef.current) el.style.cursor = 'grab';
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.style.cursor = 'grab';
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  // ─── Zoom buttons ─────────────────────────────────────────────────────────
  const zoomBy = useCallback((factor: number) => {
    const centre = vpRef.current + widthRef.current / 2 / ppyRef.current;
    const newPPY = clampPPY(ppyRef.current * factor, widthRef.current);
    setPixelsPerYear(newPPY);
    setViewportStart(clampVS(centre - widthRef.current / 2 / newPPY, newPPY, widthRef.current));
  }, []);

  // ─── Zoom to cluster ──────────────────────────────────────────────────────
  const zoomToCluster = useCallback((cluster: Cluster) => {
    const years = cluster.events.map((e) => eventToFractionalYear(e));
    const lo = Math.min(...years);
    const hi = Math.max(...years);
    const pad = Math.max(hi - lo, 1) * 0.3;
    const targetVS = lo - pad;
    const targetPPY = widthRef.current / (hi - lo + 2 * pad);
    const fromVS = vpRef.current;
    const fromPPY = ppyRef.current;
    animate(0, 1, {
      duration: 0.45,
      ease: [...TIMELINE_EASE],
      onUpdate: (t) => {
        setViewportStart(fromVS + (targetVS - fromVS) * t);
        setPixelsPerYear(fromPPY + (targetPPY - fromPPY) * t);
      },
      onComplete: () => {
        setViewportStart(targetVS);
        setPixelsPerYear(targetPPY);
      },
    });
  }, []);

  // ─── Render pipeline ──────────────────────────────────────────────────────
  const visible = getVisibleEvents(events, pixelsPerYear);
  const { singles, clusters } = clusterEvents(visible, viewportStart, pixelsPerYear);

  // Split own events: range events keep the bar style, point events get staggered cards
  const pointSingles = singles.filter((e) => e.endYear == null);
  const rangeSingles = singles.filter((e) => e.endYear != null);

  // Exclude promoted events that already appear as leaf events (direct children of current context)
  const leafIds = new Set(events.map((e) => e.id));
  const superChildEvents = (childEvents ?? []).filter((e) => e.visibility === 'super' && !leafIds.has(e.id));
  const mainChildEvents  = (childEvents ?? []).filter((e) => e.visibility === 'main' && !leafIds.has(e.id));

  // Unified level pool: all events that get cards below the axis
  // rangeSingles also get cards (in addition to their bar on the axis)
  const allPointEvents: NodeSummary[] = [...pointSingles, ...rangeSingles, ...superChildEvents, ...mainChildEvents];
  const pointLevels = assignLevels(allPointEvents, viewportStart, pixelsPerYear, SUPER_CARD_W);

  const contextColor = getAccentColor(context.color);

  // Combined entries (event + resolved color) for two-pass rendering
  type PointEntry = { ev: NodeSummary; color: string | undefined };
  const allPointEntries: PointEntry[] = [
    ...pointSingles.map((ev) => ({ ev, color: contextColor })),
    ...rangeSingles.map((ev) => ({ ev, color: contextColor })),
    ...superChildEvents.map((ev) => ({ ev, color: ev.sourceContextColor ?? undefined })),
    ...mainChildEvents.map((ev) => ({ ev, color: ev.sourceContextColor ?? undefined })),
  ];

  // Card layer: render hovered event last so it appears on top in SVG
  const cardEntries = hoveredEventId
    ? [
        ...allPointEntries.filter((e) => e.ev.id !== hoveredEventId),
        ...allPointEntries.filter((e) => e.ev.id === hoveredEventId),
      ]
    : allPointEntries;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ContextDetailHeader
        context={context}
        eventsMinYear={events.length > 0 ? minYear : null}
        eventsMaxYear={events.length > 0 ? maxYear : null}
      />

      <div
        className="relative flex-1 min-h-0 overflow-hidden select-none"
        ref={containerRef}
      >
        {width > 0 && canvasHeight > 0 && (
          <svg
            width={width}
            height={canvasHeight}
            className="absolute inset-0 pointer-events-none"
            style={{ display: 'block' }}
          >
            <TimelineAxis
              viewportStart={viewportStart}
              pixelsPerYear={pixelsPerYear}
              width={width}
              height={canvasHeight}
              axisY={axisY}
              asSvgGroup
            />

            {/* Current context bar — above child bars */}
            {showContextBar && <TimelineBar
              title={context.title}
              color={context.color?.hex ?? null}
              minYear={minYear}
              maxYear={maxYear}
              numChildren={context.children.length}
              viewportStart={viewportStart}
              pixelsPerYear={pixelsPerYear}
              axisY={axisY}
              width={width}
              nodeId={context.id}
              onSelectInfo={setSelectedEvent}
            />}

            {/* Ghost bars — sibling timelines, at the top of canvas */}
            {siblings && siblings.length > 0 && (
              <GhostBars
                siblings={siblings}
                viewportStart={viewportStart}
                pixelsPerYear={pixelsPerYear}
                width={width}
                onSelectInfo={setSelectedEvent}
                topY={8}
              />
            )}

            {/* Sub-timeline bars — above axis */}
            <SubTimelineBars
              children={context.children}
              viewportStart={viewportStart}
              pixelsPerYear={pixelsPerYear}
              width={width}
              axisY={axisY}
              onSelectInfo={setSelectedEvent}
              eventDotsMap={eventDotsMap}
            />

            {/* Clustered events */}
            {clusters.map((cl, i) => (
              <EventCluster
                key={i}
                cluster={cl}
                viewportStart={viewportStart}
                pixelsPerYear={pixelsPerYear}
                axisY={axisY}
                onZoom={zoomToCluster}
              />
            ))}

            {/* Layer 1 — stems: rendered first so they're always behind cards */}
            <g>
              {allPointEntries.map(({ ev, color }) => (
                <SuperEventStem
                  key={`stem-${ev.id}`}
                  event={ev}
                  color={color}
                  viewportStart={viewportStart}
                  pixelsPerYear={pixelsPerYear}
                  axisY={axisY}
                  width={width}
                  level={pointLevels.get(ev.id) ?? 0}
                />
              ))}
            </g>

            {/* Layer 2 — cards: hovered event rendered last → on top in SVG */}
            <g>
              {cardEntries.map(({ ev, color }) => (
                <SuperEventMarker
                  key={ev.id}
                  event={ev}
                  color={color}
                  viewportStart={viewportStart}
                  pixelsPerYear={pixelsPerYear}
                  axisY={axisY}
                  width={width}
                  level={pointLevels.get(ev.id) ?? 0}
                  isHovered={hoveredEventId === ev.id}
                  onSelect={setSelectedEvent}
                  onHover={setHoveredEventId}
                />
              ))}
            </g>
          </svg>
        )}

        <div className="absolute right-4 bottom-6 z-10 pointer-events-auto flex flex-col gap-2 items-end">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="w-10 h-10 rounded-full bg-stone-800 text-white shadow-md hover:bg-stone-700 transition-colors flex items-center justify-center text-xl leading-none"
            aria-label="Nuovo evento"
          >
            +
          </button>
          <ZoomControls
            onZoomIn={() => zoomBy(ZOOM_FACTOR)}
            onZoomOut={() => zoomBy(1 / ZOOM_FACTOR)}
            onFitToView={() => fitToView()}
          />
        </div>

        {events.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-stone-400">Nessun evento in questo contesto</p>
          </div>
        )}
      </div>

      <CreateEventModal
        parentId={context.id}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
