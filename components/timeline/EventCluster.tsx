'use client';

import { yearToPixel } from '@/lib/timeline/scale';
import { eventToFractionalYear } from '@/lib/timeline/date-utils';
import type { EventSummary } from '@/lib/types';

export interface Cluster {
  events: EventSummary[];
  representativeYear: number; // fractional year centre
}

interface Props {
  cluster: Cluster;
  viewportStart: number;
  pixelsPerYear: number;
  axisY: number;
  onZoom: (cluster: Cluster) => void;
}

export default function EventCluster({ cluster, viewportStart, pixelsPerYear, axisY, onZoom }: Props) {
  const x = yearToPixel(cluster.representativeYear, viewportStart, pixelsPerYear);
  if (x < -60 || x > 10000) return null;

  const count = cluster.events.length;
  const r = Math.min(22, 12 + Math.log2(count) * 3);
  // Cluster sits below the axis with a small gap
  const cy = axisY + r + 4;

  return (
    <g
      className="cursor-pointer"
      onClick={() => onZoom(cluster)}
      role="button"
      aria-label={`${count} eventi raggruppati`}
    >
      <title>{`${count} eventi — clicca per ingrandire`}</title>
      <circle cx={x} cy={cy} r={r + 4} fill="transparent" />
      <circle cx={x} cy={cy} r={r} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={1.5} />
      <text
        x={x}
        y={cy + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight="600"
        fill="#374151"
        fontFamily="ui-sans-serif, sans-serif"
      >
        {count}
      </text>
    </g>
  );
}

// ─── Clustering algorithm ─────────────────────────────────────────────────────

const CLUSTER_DISTANCE_PX = 28;

export function clusterEvents(
  events: EventSummary[],
  viewportStart: number,
  pixelsPerYear: number
): { singles: EventSummary[]; clusters: Cluster[] } {
  if (events.length === 0) return { singles: [], clusters: [] };

  // Sort by x position
  const withX = events
    .map((e) => ({ e, x: yearToPixel(eventToFractionalYear(e), viewportStart, pixelsPerYear) }))
    .sort((a, b) => a.x - b.x);

  const singles: EventSummary[] = [];
  const clusters: Cluster[] = [];
  let i = 0;

  while (i < withX.length) {
    const group: EventSummary[] = [withX[i].e];
    let j = i + 1;

    while (j < withX.length && withX[j].x - withX[i].x < CLUSTER_DISTANCE_PX) {
      group.push(withX[j].e);
      j++;
    }

    if (group.length === 1) {
      singles.push(group[0]);
    } else {
      const centreX = (withX[i].x + withX[j - 1].x) / 2;
      // Convert centre X back to a fractional year for the cluster
      const centreYear = viewportStart + centreX / pixelsPerYear;
      clusters.push({ events: group, representativeYear: centreYear });
    }

    i = j;
  }

  return { singles, clusters };
}
