import Link from 'next/link';
import { Image as DatoImage } from 'react-datocms';
import type { NodeCard } from '@/lib/types';
import { formatYearRange } from '@/lib/timeline/date-utils';
import { getAccentColor } from '@/lib/utils/color';
import StatusBadge from '@/components/shared/StatusBadge';

interface Props {
  node: NodeCard;
}

export default function TimelineCard({ node }: Props) {
  const { slug, title, color, featuredImage, year, endYear, concluded, children } = node;

  const accentColor = getAccentColor(color);

  const rangeLabel = formatYearRange(year, endYear, concluded);

  return (
    <Link
      href={`/timeline/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-44 bg-stone-100 overflow-hidden">
        {featuredImage?.responsiveImage ? (
          <DatoImage
            data={featuredImage.responsiveImage}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            pictureClassName="w-full h-full"
          />
        ) : (
          <div
            className="w-full h-full opacity-20"
            style={{ backgroundColor: accentColor }}
          />
        )}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-stone-900 leading-snug group-hover:text-stone-700 transition-colors">
            {title}
          </h2>
          <span
            className="mt-1 shrink-0 w-3 h-3 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-auto">
          {rangeLabel && (
            <span className="text-xs text-stone-500 font-mono">{rangeLabel}</span>
          )}
          <StatusBadge concluded={concluded} className="ml-auto" />
        </div>

        {children.length > 0 && (
          <p className="text-xs text-stone-400">
            {children.length} sotto-{children.length === 1 ? 'timeline' : 'timeline'}
          </p>
        )}
      </div>
    </Link>
  );
}
