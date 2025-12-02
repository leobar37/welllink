import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Instagram, MessageCircle, Music2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const mockProfile = {
    displayName: "Ana García",
    title: "Coach de Bienestar",
    bio: "Te ayudo a transformar tu vida en 7 días con hábitos saludables",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
};

const mockSocialLinks = [
    { platform: "whatsapp", Icon: MessageCircle },
    { platform: "instagram", Icon: Instagram },
    { platform: "tiktok", Icon: Music2 },
];

interface PhoneMockupProps {
    className?: string;
}

export function PhoneMockup({ className }: PhoneMockupProps) {
    return (
        <div className={cn("relative", className)}>
            {/* Phone Frame */}
            <div className="relative mx-auto w-[280px] sm:w-[320px]">
                {/* Phone Outer Shell */}
                <div className="rounded-[3rem] bg-gradient-to-b from-zinc-700 to-zinc-900 p-3 shadow-2xl dark:from-zinc-600 dark:to-zinc-800">
                    {/* Phone Notch */}
                    <div className="absolute left-1/2 top-4 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

                    {/* Phone Screen */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-background">
                        {/* Screen Content */}
                        <div className="min-h-[500px] sm:min-h-[580px] px-6 pb-8 pt-12">
                            {/* Profile Content */}
                            <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-700">
                                {/* Avatar */}
                                <div className="animate-in zoom-in duration-500 delay-100">
                                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg ring-2 ring-primary/20">
                                        <AvatarImage
                                            src={mockProfile.avatarUrl}
                                            alt={mockProfile.displayName}
                                        />
                                        <AvatarFallback>AG</AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Name & Title */}
                                <div className="space-y-1 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                                    <h2 className="text-lg font-bold tracking-tight">
                                        {mockProfile.displayName}
                                    </h2>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {mockProfile.title}
                                    </p>
                                </div>

                                {/* Bio */}
                                <p className="text-xs text-center text-muted-foreground max-w-[200px] leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                                    {mockProfile.bio}
                                </p>

                                {/* Social Links */}
                                <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400">
                                    {mockSocialLinks.map(({ platform, Icon }) => (
                                        <Button
                                            key={platform}
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full hover:bg-muted h-10 w-10"
                                        >
                                            <Icon className="h-5 w-5" />
                                        </Button>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="w-full h-px bg-border/50 animate-in fade-in duration-500 delay-500" />

                                {/* CTA Button */}
                                <Button
                                    className="w-full gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-600"
                                    size="lg"
                                >
                                    <Heart className="h-4 w-4" />
                                    Evalúate gratis
                                </Button>

                                {/* Secondary Button */}
                                <Button
                                    variant="outline"
                                    className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700"
                                >
                                    Mi Historia
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -left-4 top-1/4 h-16 w-1 rounded-full bg-zinc-700 dark:bg-zinc-600" />
                <div className="absolute -left-4 top-1/3 h-8 w-1 rounded-full bg-zinc-700 dark:bg-zinc-600" />
                <div className="absolute -right-4 top-1/3 h-12 w-1 rounded-full bg-zinc-700 dark:bg-zinc-600" />
            </div>
        </div>
    );
}
