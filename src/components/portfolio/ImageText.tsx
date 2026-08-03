import SectionDivider from "@/components/typography/SectionDivider";
import {
  getImageTextSectionView,
  getMediaVariants,
  type ImageTextContentSegment,
  type ImageTextItemView,
  type ImageTextMedia,
  type PageBuilderSection,
} from "@/lib/content";
import ImageTextDeviceFrame from "./ImageTextDeviceFrame";
import ImageTextVideo from "./ImageTextVideo";

const IMAGE_SIZES = "(min-width: 1024px) 50vw, 100vw";

// Ports pbImageText.vue: a titled, alternating list of image/text rows (used
// for e.g. hospitalitypulse-inc's "Initial Website" and "Highlights"
// sections). Unlike the other page-builder blocks ported so far, pbImageText
// can appear more than once per project, so per PageBuilder's contract this
// reads its data from the dispatched section instead of finding the first
// matching block itself. Confirmed against the live site (both desktop and
// mobile) that multiple items render as a plain stacked list, not a
// carousel - matches the Gridsome source, which has no Flickity wiring here
// unlike the pbCarousel* blocks.
export default function ImageText({ section }: { section: PageBuilderSection }) {
  const view = getImageTextSectionView(section);

  if (view.items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={view.title || undefined}
      className="mx-auto w-full max-w-[768px] px-5 pb-16 sm:pb-24 md:max-w-[1024px] md:px-[60px] xl:max-w-[1440px] xl:px-[100px]"
    >
      {view.title && <SectionDivider>{view.title}</SectionDivider>}

      <div className="mt-10 flex flex-col gap-10 lg:gap-[60px]">
        {view.items.map((item) => (
          <ImageTextRow key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}

// Mobile always stacks text above image, regardless of useLeftside -
// pbImageText.vue's CSS only gives `.visual` an explicit order (1, after
// `.textual`'s implicit 0) below the `lg` breakpoint, so `use_leftside` has
// no effect until the row actually goes two-column. At `lg`, useLeftside
// keeps that same text-first order (text left, image right); the default
// flips to image-first (image left, text right).
function ImageTextRow({ item }: { item: ImageTextItemView }) {
  const hasContent = item.content.length > 0;

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-[60px]">
      <div
        className={`order-2 flex ${item.useLeftside ? "justify-center lg:order-2 lg:justify-end" : "justify-center lg:order-1 lg:justify-start"}`}
      >
        <div className="w-full max-w-[600px]">
          <ImageTextVisual media={item.media} />
        </div>
      </div>

      <div className={`order-1 flex h-full flex-col justify-center ${item.useLeftside ? "lg:order-1" : "lg:order-2"}`}>
        <div className="mx-auto w-full max-w-[600px]">
          <h4
            className={`shine-text animate-shine mb-5 text-2xl leading-8 font-bold tracking-widest text-white uppercase motion-reduce:animate-none ${
              hasContent ? "" : "text-center"
            }`}
          >
            {item.title}
          </h4>
          {hasContent && (
            <p className="max-w-80 font-bold tracking-widest text-white uppercase">
              <ImageTextRichText segments={item.content} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageTextRichText({ segments }: { segments: ImageTextContentSegment[] }) {
  return segments.map((segment, index) =>
    segment.type === "link" ? (
      <a
        key={index}
        href={segment.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-blue underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        {segment.text}
      </a>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

// Dispatches on media format/screenshot-ness, mirroring snippetMedia.vue:
// device-frame chrome only wraps a screenshot image; every other image is
// plain, and a video ignores the frame entirely (has_frame requires an
// image).
function ImageTextVisual({ media }: { media: ImageTextMedia }) {
  if (media.format === "video") {
    return <ImageTextVideo media={media} />;
  }
  if (media.format === "image") {
    return media.isScreenshot ? (
      <ImageTextDeviceFrame filename={media.filename} />
    ) : (
      <ImageTextPlainImage filename={media.filename} />
    );
  }
  return null;
}

// Ports baseImage.vue as rendered by snippetMedia.vue's non-framed branch:
// object-fit: contain (not cover) capped at 450px tall, so a press-clipping
// screenshot with an arbitrary aspect ratio is never cropped.
function ImageTextPlainImage({ filename }: { filename: string }) {
  const variants = getMediaVariants(filename);
  if (variants.length === 0) {
    return null;
  }

  const largest = variants.reduce((a, b) => ((b.width ?? 0) > (a.width ?? 0) ? b : a));
  const srcSet = variants
    .filter((v): v is { width: number; url: string } => v.width != null)
    .map((v) => `${v.url} ${v.width}w`)
    .join(", ");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- discrete pre-generated manifest widths need a manual srcset, not Next's continuous loader model
    <img
      src={largest.url}
      srcSet={srcSet || undefined}
      sizes={srcSet ? IMAGE_SIZES : undefined}
      alt=""
      loading="lazy"
      decoding="async"
      className="mx-auto max-h-[450px] w-full object-contain"
    />
  );
}
