'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTimelineStore } from '@/lib/store';
import { performRequest } from '@/lib/datocms/client';
import { EVENT_DETAIL_QUERY } from '@/lib/datocms/queries';
import type { EventDetail } from '@/lib/types';
import DatoImage from '@/components/shared/DatoImage';
import DatoStructuredText from '@/components/shared/DatoStructuredText';
import RelatedEventsList from '@/components/detail/RelatedEventsList';
import EventDetailMeta from '@/components/detail/EventDetailMeta';
import EventDetailMedia from '@/components/detail/EventDetailMedia';
import EventDetailLinks from '@/components/detail/EventDetailLinks';
import EventDetailCustomFields from '@/components/detail/EventDetailCustomFields';
import { getAccentColor } from '@/lib/utils/color';

interface QueryResult {
  event: EventDetail | null;
}

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

  const accentColor = getAccentColor(event?.context?.color);

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
                <EventDetailMeta event={event} accentColor={accentColor} />

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

                <EventDetailMedia media={event.media} />
                <EventDetailLinks links={event.externalLinks ?? []} />
                <EventDetailCustomFields fields={event.customFields ?? []} />

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
