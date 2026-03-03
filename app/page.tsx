import { performRequest } from '@/lib/datocms/client';
import { ALL_ROOT_NODES_QUERY } from '@/lib/datocms/queries';
import type { NodeCard } from '@/lib/types';
import HomeView from '@/components/home/HomeView';

interface QueryResult {
  allNodes: NodeCard[];
}

export default async function HomePage() {
  const { allNodes } = await performRequest<QueryResult>(ALL_ROOT_NODES_QUERY);

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Trama</h1>
          <span className="text-sm text-stone-400">esplora processi attraverso il tempo</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <HomeView allNodes={allNodes} />
      </div>
    </main>
  );
}
