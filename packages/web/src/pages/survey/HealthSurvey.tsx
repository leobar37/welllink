import { useState } from "react"
import { useParams } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"

const surveySchema = z.object({
  visitorName: z.string().min(2, "Name is required"),
  visitorEmail: z.string().email("Valid email is required"),
  visitorWhatsapp: z.string().min(8, "WhatsApp number is required"),
  goal: z.enum(["weight_loss", "muscle_gain", "energy", "digestion"]),
  activityLevel: z.enum(["sedentary", "moderate", "active"]),
  dietType: z.enum(["omnivore", "vegetarian", "vegan", "keto"]),
})

type SurveyValues = z.infer<typeof surveySchema>

export function HealthSurveyPage() {
  const { username } = useParams<{ username: string }>()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<SurveyValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      visitorName: "",
      visitorEmail: "",
      visitorWhatsapp: "",
    },
  })

  async function onSubmit(values: SurveyValues) {
    if (!username) return
    
    setLoading(true)
    try {
      // First get profile ID by username
      const { data: profile } = await api.api.profiles.username[username].get()
      
      if (!profile) {
        toast.error("Profile not found")
        return
      }

      // Submit survey
      // @ts-expect-error: API typings do not yet include the public survey endpoint
      const { error } = await api.api["health-survey"].public.post({
        profileId: profile.id,
        visitorName: values.visitorName,
        visitorEmail: values.visitorEmail,
        visitorWhatsapp: values.visitorWhatsapp,
        responses: {
            goal: values.goal,
            activityLevel: values.activityLevel,
            dietType: values.dietType
        }
      })

      if (error) throw error
      
      setSubmitted(true)
      toast.success("Survey submitted successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to submit survey")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Thank You!</CardTitle>
                    <CardDescription>
                        Your health survey has been submitted. I will review your answers and contact you shortly via WhatsApp.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 py-8">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Health Transformation Survey</CardTitle>
          <CardDescription className="text-center">
            Tell me about your goals so I can help you better.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <FormField
                    control={form.control}
                    name="visitorName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="visitorEmail"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="visitorWhatsapp"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormDescription>
                            I will send your results here.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Health Goals</h3>
                <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>What is your main goal?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a goal" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="weight_loss">Weight Loss</SelectItem>
                            <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                            <SelectItem value="energy">More Energy</SelectItem>
                            <SelectItem value="digestion">Better Digestion</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="activityLevel"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Activity Level</FormLabel>
                        <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                        >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="sedentary" />
                            </FormControl>
                            <FormLabel className="font-normal">Sedentary (Office job, little exercise)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="moderate" />
                            </FormControl>
                            <FormLabel className="font-normal">Moderate (1-3 days exercise/week)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="active" />
                            </FormControl>
                            <FormLabel className="font-normal">Active (4+ days exercise/week)</FormLabel>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Survey
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
