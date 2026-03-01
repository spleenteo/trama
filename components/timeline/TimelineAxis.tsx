'use client';

import { getAxisLabels, yearToPixel } from '@/lib/timeline/scale';

interface Props {
  viewportStart: number;
  pixelsPerYear: number;
  width: number;
  height?: number;
  axisY: number;
  /** When true, renders a <g> instead of a standalone <svg> (for composing into a parent SVG) */
  asSvgGroup?: boolean;
}

const TICK_MAJOR = 12;
const TICK_MINOR = 6;
const CURRENT_YEAR = new Date().getFullYear();

function AxisContent({
  viewportStart,
  pixelsPerYear,
  width,
  height = 80,
  axisY,
}: Omit<Props, 'asSvgGroup'>) {
  if (width <= 0) return null;

  const viewportEnd = viewportStart + width / pixelsPerYear;
  const labels = getAxisLabels(viewportStart, viewportEnd, width);

  const presentX = yearToPixel(CURRENT_YEAR, viewportStart, pixelsPerYear);
  const showPresent = presentX >= 0 && presentX <= width;

  return (
    <>
      {/* Main axis line */}
      <line x1={0} y1={axisY} x2={width} y2={axisY} stroke="#d1d5db" strokeWidth={1} />

      {/* Labels + ticks */}
      {labels.map((lbl) => (
        <g key={lbl.year} transform={`translate(${lbl.x}, 0)`}>
          <line
            x1={0} y1={axisY - TICK_MAJOR}
            x2={0} y2={axisY + TICK_MINOR}
            stroke="#9ca3af" strokeWidth={1}
          />
          <text
            y={axisY - TICK_MAJOR - 4}
            textAnchor="middle"
            fontSize={10}
            fill="#6b7280"
            fontFamily="ui-monospace, monospace"
          >
            {lbl.label}
          </text>
        </g>
      ))}

      {/* Present marker */}
      {showPresent && (
        <g transform={`translate(${presentX}, 0)`}>
          <line
            x1={0} y1={0} x2={0} y2={height}
            stroke="#10b981" strokeWidth={1.5}
            strokeDasharray="4 3" opacity={0.7}
          />
          <text
            y={axisY + TICK_MINOR + 14}
            textAnchor="middle"
            fontSize={9}
            fill="#10b981"
            fontWeight="600"
            fontFamily="ui-monospace, monospace"
          >
            oggi
          </text>
        </g>
      )}
    </>
  );
}

export default function TimelineAxis({ asSvgGroup, ...props }: Props) {
  if (asSvgGroup) {
    return (
      <g>
        <AxisContent {...props} />
      </g>
    );
  }

  return (
    <svg
      width={props.width}
      height={props.height ?? 80}
      className="overflow-visible select-none"
      style={{ display: 'block' }}
    >
      <AxisContent {...props} />
    </svg>
  );
}
