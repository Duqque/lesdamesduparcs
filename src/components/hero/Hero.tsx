import { HeroBackdrop } from "./HeroBackdrop";
import { HeroContent } from "./HeroContent";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="grain vignette relative flex min-h-[clamp(580px,82svh,760px)] items-end overflow-hidden bg-night-950 md:min-h-[560px] xl:min-h-[clamp(500px,50vh,660px)] xl:items-start"
    >
      <HeroBackdrop />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(3,9,25,0.55)_0%,rgba(3,9,25,0.05)_24%,rgba(3,9,25,0.35)_52%,rgba(3,9,25,0.96)_100%)] xl:bg-[linear-gradient(90deg,#030919_0%,rgba(3,9,25,0.92)_20%,rgba(3,9,25,0.45)_46%,rgba(3,9,25,0)_72%),linear-gradient(180deg,rgba(3,9,25,0.6)_0%,rgba(3,9,25,0)_22%,rgba(3,9,25,0)_78%,rgba(3,9,25,0.55)_100%)]"
      />
      <HeroContent />
    </section>
  );
}
