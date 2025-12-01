import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";

interface ProfileHeaderProps {
    profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    const initials = profile.displayName
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">{profile.displayName}</h1>
                {profile.title && (
                    <p className="text-muted-foreground font-medium">{profile.title}</p>
                )}
                {profile.bio && (
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        {profile.bio}
                    </p>
                )}
            </div>
        </div>
    );
}
