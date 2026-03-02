import type { ExternalLink } from '@/lib/types';

interface Props {
  links: ExternalLink[];
}

export default function EventDetailLinks({ links }: Props) {
  if (links.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
        Link
      </h3>
      <ul className="space-y-1">
        {links.map((link, i) => (
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
  );
}
