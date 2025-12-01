import type { SocialLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
    Instagram,
    Facebook,
    Twitter,
    Youtube,
    Linkedin,
    Globe,
    Mail,
    Phone,
    type LucideIcon
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

export function SocialLinks({ links }: SocialLinksProps) {
    if (!links.length) return null;

    return (
        <div className="flex flex-wrap justify-center gap-2">
            {links
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((link) => {
                    const Icon = iconMap[link.platform.toLowerCase()] || Globe;

                    return (
                        <Button
                            key={link.id}
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-muted"
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
