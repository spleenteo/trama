'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTimelineStore } from '@/lib/store';
import { performRequest } from '@/lib/datocms/client';
import { EVENT_DETAIL_QUERY } from '@/lib/datocms/queries';
import type { EventDetail } from '@/lib/types';
import { formatTimelineDate, formatDuration } from '@/lib/timeline/date-utils';
import DatoImage from '@/components/shared/DatoImage';
import DatoStructuredText from '@/components/shared/DatoStructuredText';
import RelatedEventsList from '@/components/detail/RelatedEventsList';

interface QueryResult {
  event: EventDetail | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  incident: 'Incidente',
  key_moment: 'Momento chiave',
};

export default function EventDetailPanel() {
  const router = useRouter();
  const selectedEventId = useTimelineStore((s) => s.selectedEventId);
  const clearSelectedEvent = useTimelineStore((s) => s.clearSelectedEvent);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch event detail when selection changes
  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { event: data } = await performRequest<QueryResult>(EVENT_DETAIL_QUERY, {
        eventId: id,
      });
      setEvent(data);
      // Update URL with ?event=slug
      if (data) {
        const url = new URL(window.location.href);
        url.searchParams.set('event', data.slug);
        router.replace(url.pathname + url.search, { scroll: false });
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (selectedEventId) {
      fetchDetail(selectedEventId);
    } else {
      setEvent(null);
      // Remove ?event from URL
      const url = new URL(window.location.href);
      if (url.searchParams.has('event')) {
        url.searchParams.delete('event');
        router.replace(url.pathname + url.search, { scroll: false });
      }
    }
  }, [selectedEventId, fetchDetail, router]);

  const handleClose = () => {
    clearSelectedEvent();
  };

  const accentColor = event?.context?.color?.hex ?? '#6b7280';

  return (
    <AnimatePresence>
      {selectedEventId && (
        <motion.aside
          key="event-detail"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-80 lg:w-96 bg-white border-l border-stone-200 shadow-xl flex flex-col z-20 overflow-hidden"
        >
          {/* Header */}
          <div
            className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-stone-100"
            style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
          >
            <span className="text-xs font-semibold text-stone-500 truncate">
              {event?.context?.title ?? '…'}
            </span>
            <button
              onClick={handleClose}
              className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
              aria-label="Chiudi pannello"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="w-5 h-5 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin" />
              </div>
            )}

            {!loading && event && (
              <div className="flex flex-col gap-5 p-4">
                {/* Title + meta */}
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

                {/* Featured image */}
                {event.featuredImage?.responsiveImage && (
                  <div className="rounded-xl overflow-hidden -mx-4">
                    <DatoImage
                      data={event.featuredImage.responsiveImage}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <DatoStructuredText data={event.description} />
                )}

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {event.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: tag.color ? `${tag.color.hex}22` : '#f3f4f6',
                          color: tag.color?.hex ?? '#374151',
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Media gallery */}
                {event.media.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                      Media
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {event.media.map((m) => (
                        m.responsiveImage ? (
                          <div key={m.url} className="rounded-lg overflow-hidden aspect-square">
                            <DatoImage data={m.responsiveImage} className="w-full h-full object-cover" />
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}

                {/* External links */}
                {event.externalLinks && event.externalLinks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                      Link
                    </h3>
                    <ul className="space-y-1">
                      {event.externalLinks.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block"
                          >
                            {link.label || link.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Custom fields */}
                {event.customFields && event.customFields.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                      Dati
                    </h3>
                    <table className="w-full text-xs">
                      <tbody>
                        {event.customFields.map((f, i) => (
                          <tr key={i} className="border-b border-stone-50">
                            <td className="py-1 pr-3 text-stone-500 font-medium whitespace-nowrap">{f.key}</td>
                            <td className="py-1 text-stone-700">{f.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Related events */}
                {event.relatedEvents.length > 0 && (
                  <RelatedEventsList
                    related={event.relatedEvents}
                    currentContextId={event.context.id}
                  />
                )}
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
