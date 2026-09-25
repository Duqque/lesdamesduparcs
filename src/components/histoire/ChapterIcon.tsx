import { BookOpen, Flag, Heart, IdCard, Landmark, Mail, Map, Megaphone, MessagesSquare, Route, Users, Venus, type LucideIcon } from "lucide-react";
import type { ChapterIconName } from "@/data/chapters";

const icons: Record<ChapterIconName, LucideIcon> = { Mail, BookOpen, Users, Heart, Venus, Map, Megaphone, MessagesSquare, Route, Landmark, Flag, IdCard };

export function ChapterIcon({ name, className, strokeWidth = 1.6 }: { name: ChapterIconName; className?: string; strokeWidth?: number }) {
  const Icon = icons[name];
  return <Icon aria-hidden className={className} strokeWidth={strokeWidth} />;
}
