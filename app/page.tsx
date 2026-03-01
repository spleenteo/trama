import { performRequest } from '@/lib/datocms/client';
import { ALL_ROOT_CONTEXTS_QUERY } from '@/lib/datocms/queries';
import type { ContextCard } from '@/lib/types';
import HomeView from '@/components/home/HomeView';

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
        <HomeView allContexts={allContexts} />
      </div>
    </main>
  );
}
