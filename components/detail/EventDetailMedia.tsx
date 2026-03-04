import type { AdditionalContentBlock, VideoField } from '@/lib/types';
import DatoImage from '@/components/shared/DatoImage';

function videoEmbedUrl(video: VideoField): string {
  if (video.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${video.providerUid}`;
  }
  if (video.provider === 'vimeo') {
    return `https://player.vimeo.com/video/${video.providerUid}`;
  }
  return video.url;
}

interface Props {
  blocks: AdditionalContentBlock[];
}

export default function EventDetailMedia({ blocks }: Props) {
  const photoBlocks = blocks.filter(
    (b): b is Extract<AdditionalContentBlock, { __typename: 'PhotoGalleryRecord' }> =>
      b.__typename === 'PhotoGalleryRecord'
  );
  const videoBlocks = blocks.filter(
    (b): b is Extract<AdditionalContentBlock, { __typename: 'VideoRecord' }> =>
      b.__typename === 'VideoRecord'
  );

  if (photoBlocks.length === 0 && videoBlocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {photoBlocks.map((block) =>
        block.gallery.length > 0 ? (
          <div key={block.id}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
              Galleria
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {block.gallery.map((img) =>
                img.responsiveImage ? (
                  <div key={img.url} className="rounded-lg overflow-hidden aspect-square">
                    <DatoImage
                      data={img.responsiveImage}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null
              )}
            </div>
          </div>
        ) : null
      )}

      {videoBlocks.map((block) => (
        <div key={block.id}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
            Video
          </h3>
          <div className="rounded-lg overflow-hidden aspect-video bg-stone-100">
            <iframe
              src={videoEmbedUrl(block.video)}
              title={block.video.title ?? 'Video'}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ))}
    </div>
  );
}
