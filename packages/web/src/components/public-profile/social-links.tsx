import type { SocialLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
  Mail,
  Phone,
  type LucideIcon,
} from "lucide-react";

interface SocialLinksProps {
  links: SocialLink[];
}

const iconMap: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  website: Globe,
  email: Mail,
  phone: Phone,
};

const platformColors: Record<string, string> = {
  instagram:
    "hover:bg-gradient-to-br hover:from-purple-500/20 hover:via-pink-500/20 hover:to-yellow-500/20 hover:text-pink-600",
  facebook: "hover:bg-blue-500/10 hover:text-blue-600",
  twitter: "hover:bg-sky-500/10 hover:text-sky-600",
  youtube: "hover:bg-red-500/10 hover:text-red-600",
  linkedin: "hover:bg-blue-600/10 hover:text-blue-700",
  website: "hover:bg-primary/10 hover:text-primary",
  email: "hover:bg-orange-500/10 hover:text-orange-600",
  phone: "hover:bg-emerald-500/10 hover:text-emerald-600",
};

export function SocialLinks({ links }: SocialLinksProps) {
  if (!links.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {links
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((link) => {
          const Icon = iconMap[link.platform.toLowerCase()] || Globe;
          const colorClass =
            platformColors[link.platform.toLowerCase()] ||
            platformColors.website;

          return (
            <Button
              key={link.id}
              variant="ghost"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-xl transition-all duration-200",
                "bg-muted/30 hover:bg-muted/50 hover:scale-110 hover:shadow-md",
                "active:scale-95",
                colorClass,
              )}
              asChild
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.platform}
              >
                <Icon className="h-5 w-5" />
              </a>
            </Button>
          );
        })}
    </div>
  );
}
