import type { FileField } from '@/lib/types';
import DatoImage from '@/components/shared/DatoImage';

interface Props {
  media: FileField[];
}

export default function EventDetailMedia({ media }: Props) {
  if (media.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
        Media
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {media.map((m) => (
          m.responsiveImage ? (
            <div key={m.url} className="rounded-lg overflow-hidden aspect-square">
              <DatoImage data={m.responsiveImage} className="w-full h-full object-cover" />
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}
