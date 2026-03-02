interface Props {
  isConcluded: boolean | null;
  className?: string;
}

export default function StatusBadge({ isConcluded, className = '' }: Props) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        isConcluded
          ? 'bg-stone-100 text-stone-500'
          : 'bg-emerald-50 text-emerald-700'
      } ${className}`}
    >
      {isConcluded ? 'conclusa' : 'in corso'}
    </span>
  );
}
