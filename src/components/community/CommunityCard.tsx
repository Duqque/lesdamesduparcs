import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PhotoCard } from "@/components/ui/PhotoCard";
import type { Community } from "@/types";

export function CommunityCard({ community }: { community: Community }) {
  return (
    <PhotoCard label={community.title} icon={Users} image={community.image} sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw" overlayClassName="bg-[linear-gradient(180deg,rgba(3,9,25,0.3)_0%,rgba(3,9,25,0.12)_30%,rgba(3,9,25,0.8)_68%,rgba(3,9,25,0.95)_100%)]">
      <p className="font-body text-[15px] font-medium leading-[1.45] text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
        {community.text}
      </p>
      <div className="mt-7">
        <Button variant="outline" size="xs" href={community.href}>
          Rejoindre la communauté
        </Button>
      </div>
    </PhotoCard>
  );
}
