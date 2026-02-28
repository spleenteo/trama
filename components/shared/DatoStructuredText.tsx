import { StructuredText } from 'react-datocms';

interface Props {
  data: object;
}

export default function DatoStructuredText({ data }: Props) {
  if (!data) return null;
  return (
    <div className="prose prose-sm prose-stone max-w-none">
      <StructuredText data={data as Parameters<typeof StructuredText>[0]['data']} />
    </div>
  );
}
