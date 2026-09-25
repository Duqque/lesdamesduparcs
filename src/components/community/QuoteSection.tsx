import Image from "next/image";
import { Scribble } from "@/components/ui/Scribble";

export function QuoteSection({ text, image }: { text: string; image: string }) {
  const [first, second] = text.split(", ");
  return (
    <figure
      data-cursor="view"
      className="group relative isolate flex w-full min-h-[250px] items-center overflow-hidden rounded-[6px] border border-line bg-night-900 px-6 py-8 md:min-h-[220px] xl:min-h-[220px] xl:px-12 xl:py-8"
    >
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <Image src={image} alt="" fill sizes="(min-width: 1280px) 40vw, 100vw" className="object-cover object-[70%_40%] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,9,25,0.86)_0%,rgba(3,9,25,0.55)_50%,rgba(3,9,25,0.7)_100%)]" />
      </div>
      <blockquote className="relative font-script text-[clamp(28px,7vw,42px)] font-medium leading-[1.02] text-white md:text-[clamp(24px,3vw,34px)] xl:text-[clamp(26px,2.05vw,34px)]">
        <p>
          &laquo;&nbsp;{first},
          <br />
          <span className="relative inline-block pl-[0.6em]">
            {second}&nbsp;&raquo;
            <Scribble className="absolute -bottom-[0.28em] left-0 h-[0.3em] w-[70%]" />
          </span>
        </p>
      </blockquote>
      <figcaption className="sr-only">Citation des Dames du Parc</figcaption>
    </figure>
  );
}
