import Image from "next/image";

export function IntroSplash() {
  return (
    <div aria-hidden className="intro-splash">
      <Image src="/logos/dames-du-parc-logo.webp" alt="" width={140} height={140} priority className="size-[112px] rounded-full md:size-[140px]" />
    </div>
  );
}
