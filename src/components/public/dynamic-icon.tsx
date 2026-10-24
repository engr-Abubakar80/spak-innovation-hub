import {
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  GraduationCap,
  Handshake,
  Leaf,
  Lightbulb,
  Presentation,
  Rocket,
  Sparkles,
  Tv,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  GraduationCap,
  Handshake,
  Leaf,
  Lightbulb,
  Presentation,
  Rocket,
  Sparkles,
  Tv,
  Users,
  Video,
};

export function DynamicIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Sparkles;
  return <Icon className={className} aria-hidden />;
}
