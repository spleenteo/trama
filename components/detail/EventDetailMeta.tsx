import type { NodeDetail } from '@/lib/types';
import { formatTimelineDate, formatDuration } from '@/lib/timeline/date-utils';

const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  incident: 'Incidente',
  key_moment: 'Momento chiave',
};

interface Props {
  event: NodeDetail;
  accentColor: string;
}

export default function EventDetailMeta({ event, accentColor }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: accentColor }}
        >
          {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
        </span>
        <span className="text-xs text-stone-400 font-mono">
          {formatTimelineDate(event.year, event.month, event.day)}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-stone-900 leading-snug">
        {event.title}
      </h2>
      {event.endYear && (
        <p className="text-xs text-stone-500 mt-1">
          Fino a {formatTimelineDate(event.endYear, event.endMonth, event.endDay)}
          {' · '}
          <span className="text-stone-400">
            {formatDuration(event.year, event.month, event.endYear, event.endMonth)}
          </span>
        </p>
      )}
    </div>
  );
}
