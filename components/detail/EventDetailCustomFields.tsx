import type { CustomField } from '@/lib/types';

interface Props {
  fields: CustomField[];
}

export default function EventDetailCustomFields({ fields }: Props) {
  if (fields.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
        Dati
      </h3>
      <table className="w-full text-xs">
        <tbody>
          {fields.map((f, i) => (
            <tr key={i} className="border-b border-stone-50">
              <td className="py-1 pr-3 text-stone-500 font-medium whitespace-nowrap">{f.key}</td>
              <td className="py-1 text-stone-700">{f.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
