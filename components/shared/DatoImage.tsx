import { Image } from 'react-datocms';
import type { ResponsiveImage } from '@/lib/types';

interface Props {
  data: ResponsiveImage;
  className?: string;
  pictureClassName?: string;
}

export default function DatoImage({ data, className, pictureClassName }: Props) {
  return (
    <Image
      data={data}
      className={className}
      pictureClassName={pictureClassName}
    />
  );
}
