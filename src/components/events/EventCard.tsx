import { Calendar, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { formatDayMonth, formatTime } from "@/lib/format";
import type { ClubEvent } from "@/types";

export function EventCard({ event }: { event: ClubEvent }) {
  return (
    <PhotoCard label="Événements" icon={Sparkles} image={event.image} sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw">
      <h3 className="font-body text-[20px] font-semibold leading-tight text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
        {event.title}
      </h3>
      <ul className="mt-4 space-y-2.5 font-body text-[12px] text-white/85">
        <li className="flex items-center gap-2">
          <Calendar aria-hidden className="size-[13px] shrink-0" strokeWidth={1.8} />
          <time dateTime={event.date}>
            {formatDayMonth(event.date)} · {formatTime(event.time)}
          </time>
        </li>
        <li className="flex items-center gap-2">
          <MapPin aria-hidden className="size-[13px] shrink-0" strokeWidth={1.8} />
          {event.venue}
        </li>
      </ul>
      <div className="mt-7">
        <Button variant="outline" size="xs" href={`/evenements/${event.id}`}>
          En savoir plus
        </Button>
      </div>
    </PhotoCard>
  );
}
