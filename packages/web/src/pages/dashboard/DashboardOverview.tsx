import { Link } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, MousePointerClick, FileText, ExternalLink, Share2, PenSquare } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useProfile, useProfileStats } from "@/hooks/use-profile"

export function DashboardOverview() {
  const { data: session } = authClient.useSession()
  const { profile, isLoading: loadingProfile } = useProfile()
  const { data: stats, isLoading: loadingStats } = useProfileStats(profile?.id)

  if (loadingProfile || loadingStats) {
    return <DashboardSkeleton />
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">No profile found</h2>
        <p className="text-muted-foreground mb-4">Complete onboarding to see your dashboard.</p>
        <Button asChild>
            <Link to="/onboarding">Go to Onboarding</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
            Hello, {profile.displayName || session?.user.name} 👋
        </h1>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <a href={`/${profile.username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Public
                </a>
            </Button>
            <Button asChild>
                 <Link to="/dashboard/qr">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                 </Link>
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.views || 0}</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.socialClicks || 0}</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Survey Responses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         {/* Placeholder for Chart or Activity Feed */}
         <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-[200px] text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                    No recent activity to show
                </div>
            </CardContent>
         </Card>

         <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start" asChild>
                    <Link to="/dashboard/profile">
                        <PenSquare className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                    <Link to="/dashboard/features">
                        <FileText className="mr-2 h-4 w-4" />
                        Manage Features
                    </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                    <Link to="/dashboard/settings">
                        <Share2 className="mr-2 h-4 w-4" />
                        Account Settings
                    </Link>
                </Button>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-64" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        </div>
    )
}
