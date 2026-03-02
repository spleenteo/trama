interface Props {
  concluded: boolean | null;
  className?: string;
}

export default function StatusBadge({ concluded, className = '' }: Props) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        concluded
          ? 'bg-stone-100 text-stone-500'
          : 'bg-emerald-50 text-emerald-700'
      } ${className}`}
    >
      {concluded ? 'conclusa' : 'in corso'}
    </span>
  );
}
