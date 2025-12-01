import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"

type SurveyResponse = {
  id: string
  createdAt: string
  visitorName?: string | null
  visitorWhatsapp?: string | null
  responses?: {
    goal?: string | null
  } | null
  status?: string | null
}

export function SurveyResults() {
  const { profile } = useProfile()
  
  const { data: surveys = [], isLoading } = useQuery<SurveyResponse[]>({
    queryKey: ["surveys", profile?.id],
    queryFn: async () => {
        if (!profile?.id) return []
        const { data, error } = await api.api["health-survey"].get({ 
            $query: { profileId: profile.id } 
        })
        if (error) throw error
        return Array.isArray(data) ? (data as SurveyResponse[]) : []
    },
    enabled: !!profile?.id
  })

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Survey Results</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>
                View who has completed your health survey.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Goal</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {surveys.length > 0 ? (
                        surveys.map((survey) => (
                            <TableRow key={survey.id}>
                                <TableCell>
                                    {format(new Date(survey.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {survey.visitorName}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                        {survey.responses?.goal?.replace("_", " ") || "Unknown"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {survey.visitorWhatsapp}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={survey.status === 'new' ? 'default' : 'outline'}>
                                        {survey.status || 'New'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No survey responses yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
