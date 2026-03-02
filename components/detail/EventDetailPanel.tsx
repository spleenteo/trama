'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTimelineStore } from '@/lib/store';
import { performRequest } from '@/lib/datocms/client';
import { NODE_DETAIL_QUERY } from '@/lib/datocms/queries';
import type { NodeDetail } from '@/lib/types';
import DatoImage from '@/components/shared/DatoImage';
import DatoStructuredText from '@/components/shared/DatoStructuredText';
import RelatedNodesList from '@/components/detail/RelatedNodesList';
import EventDetailMeta from '@/components/detail/EventDetailMeta';
import EventDetailMedia from '@/components/detail/EventDetailMedia';
import EventDetailLinks from '@/components/detail/EventDetailLinks';
import EventDetailCustomFields from '@/components/detail/EventDetailCustomFields';
import { getAccentColor } from '@/lib/utils/color';

interface QueryResult {
  node: NodeDetail | null;
}

export default function EventDetailPanel() {
  const router = useRouter();
  const selectedEventId = useTimelineStore((s) => s.selectedEventId);
  const clearSelectedEvent = useTimelineStore((s) => s.clearSelectedEvent);

  const [node, setNode] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch node detail when selection changes
  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { node: data } = await performRequest<QueryResult>(NODE_DETAIL_QUERY, {
        nodeId: id,
      });
      setNode(data);
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
      setNode(null);
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

  const accentColor = getAccentColor(node?.parent?.color ?? node?.color);

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
              {node?.parent?.title ?? '…'}
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

            {!loading && node && (
              <div className="flex flex-col gap-5 p-4">
                <EventDetailMeta event={node} accentColor={accentColor} />

                {/* Featured image */}
                {node.featuredImage?.responsiveImage && (
                  <div className="rounded-xl overflow-hidden -mx-4">
                    <DatoImage
                      data={node.featuredImage.responsiveImage}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Description */}
                {node.description && (
                  <DatoStructuredText data={node.description} />
                )}

                {/* Tags */}
                {node.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {node.tags.map((tag) => (
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

                <EventDetailMedia media={node.media} />
                <EventDetailLinks links={node.externalLinks ?? []} />
                <EventDetailCustomFields fields={node.customFields ?? []} />

                {/* Related nodes */}
                {node.relatedNodes.length > 0 && (
                  <RelatedNodesList
                    related={node.relatedNodes}
                    currentParentId={node.parent?.id ?? null}
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
