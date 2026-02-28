import { performRequest } from '@/lib/datocms/client';
import { ALL_ROOT_CONTEXTS_QUERY } from '@/lib/datocms/queries';
import type { ContextCard } from '@/lib/types';
import TimelineCard from '@/components/home/TimelineCard';

interface QueryResult {
  allContexts: ContextCard[];
}

export default async function HomePage() {
  const { allContexts } = await performRequest<QueryResult>(ALL_ROOT_CONTEXTS_QUERY);

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Timeo</h1>
          <span className="text-sm text-stone-400">esplora processi attraverso il tempo</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {allContexts.length === 0 ? (
          <p className="text-stone-500 text-center py-20">
            Nessuna timeline trovata. Crea dei Context radice su DatoCMS.
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-6">
              Timeline ({allContexts.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allContexts.map((ctx) => (
                <TimelineCard key={ctx.id} context={ctx} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
