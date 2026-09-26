import Image from "next/image";
import { getGroupPhotos } from "@/lib/server/site";

/** Photo de supporters d'un chapitre (modifiable en administration) : remplace les anciennes illustrations. */
export async function ChapterPhoto({ slug, priority = true }: { slug: string; priority?: boolean }) {
  const photo = (await getGroupPhotos())[slug];
  if (!photo) return null;
  return (
    <figure className="relative isolate aspect-[4/3] w-full overflow-hidden rounded-[10px] border border-line bg-night-900 md:aspect-[5/6]">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        unoptimized={photo.src.startsWith("/medias/") || photo.src.startsWith("http")}
        sizes="(min-width: 768px) 45vw, 100vw"
        className="object-cover saturate-[0.85]"
      />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,25,0)_55%,rgba(3,9,25,0.6)_100%)]" />
    </figure>
  );
}
