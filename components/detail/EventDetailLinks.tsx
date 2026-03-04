import type { AdditionalContentBlock } from '@/lib/types';

interface Props {
  blocks: AdditionalContentBlock[];
}

export default function EventDetailLinks({ blocks }: Props) {
  const linkBlocks = blocks.filter(
    (b): b is Extract<AdditionalContentBlock, { __typename: 'LinkRecord' }> =>
      b.__typename === 'LinkRecord'
  );

  if (linkBlocks.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
        Link
      </h3>
      <ul className="space-y-1">
        {linkBlocks.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block"
            >
              {link.name || link.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
