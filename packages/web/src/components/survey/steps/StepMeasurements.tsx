import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useWizard } from "../wizard/WizardContext"
import { measurementsSchema, type MeasurementsForm } from "@/lib/survey/schema"
import { SurveyNavigation } from "../wizard/SurveyNavigation"

export function StepMeasurements() {
  const { state, updateMeasurements, nextStep } = useWizard()

  // Local state for input display values (allows empty string while typing)
  const [displayValues, setDisplayValues] = useState({
    weight: state.data.measurements?.weight?.toString() || "",
    height: state.data.measurements?.height?.toString() || "",
    age: state.data.measurements?.age?.toString() || "",
  })

  const form = useForm<MeasurementsForm>({
    resolver: zodResolver(measurementsSchema),
    defaultValues: state.data.measurements || {
      weight: 0,
      height: 0,
      age: 0,
    },
    mode: "onBlur",
  })

  const onSubmit = (data: MeasurementsForm) => {
    updateMeasurements(data)
    nextStep()
  }

  // Calculate BMI if both weight and height are available
  const weight = form.watch("weight")
  const height = form.watch("height")
  const bmi = weight > 0 && height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) : null

  const getBMICategory = (bmi: number): { label: string; color: string } => {
    if (bmi < 18.5) return { label: "Bajo peso", color: "text-yellow-600" }
    if (bmi < 25) return { label: "Peso saludable", color: "text-green-600" }
    if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-600" }
    return { label: "Área de oportunidad", color: "text-orange-600" }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 px-4 py-6">
        <Card className="max-w-lg mx-auto border-0 shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-xl">Tus medidas actuales</CardTitle>
            <CardDescription>
              Estos datos nos ayudan a entender mejor tu situación.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            <Form {...form}>
              <form
                id="measurements-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="70"
                            className="h-12 pr-12"
                            value={displayValues.weight}
                            onChange={(e) => {
                              const value = e.target.value
                              // Allow empty string or valid decimal numbers
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                setDisplayValues((prev) => ({ ...prev, weight: value }))
                                const numValue = parseFloat(value)
                                field.onChange(isNaN(numValue) ? 0 : numValue)
                              }
                            }}
                            onBlur={() => {
                              field.onBlur()
                              // Format display on blur if empty
                              if (displayValues.weight === "") {
                                setDisplayValues((prev) => ({ ...prev, weight: "0" }))
                              }
                            }}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            kg
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estatura (cm) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="170"
                            className="h-12 pr-12"
                            value={displayValues.height}
                            onChange={(e) => {
                              const value = e.target.value
                              // Allow empty string or valid integers
                              if (value === "" || /^\d*$/.test(value)) {
                                setDisplayValues((prev) => ({ ...prev, height: value }))
                                const numValue = parseInt(value)
                                field.onChange(isNaN(numValue) ? 0 : numValue)
                              }
                            }}
                            onBlur={() => {
                              field.onBlur()
                              if (displayValues.height === "") {
                                setDisplayValues((prev) => ({ ...prev, height: "0" }))
                              }
                            }}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            cm
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Edad (años) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="30"
                            className="h-12 pr-16"
                            value={displayValues.age}
                            onChange={(e) => {
                              const value = e.target.value
                              // Allow empty string or valid integers
                              if (value === "" || /^\d*$/.test(value)) {
                                setDisplayValues((prev) => ({ ...prev, age: value }))
                                const numValue = parseInt(value)
                                field.onChange(isNaN(numValue) ? 0 : numValue)
                              }
                            }}
                            onBlur={() => {
                              field.onBlur()
                              if (displayValues.age === "") {
                                setDisplayValues((prev) => ({ ...prev, age: "0" }))
                              }
                            }}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            años
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* BMI Display */}
                {bmi && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tu IMC</span>
                      <div className="text-right">
                        <span className="text-lg font-semibold">{bmi}</span>
                        <span className={`ml-2 text-sm ${getBMICategory(parseFloat(bmi)).color}`}>
                          {getBMICategory(parseFloat(bmi)).label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <SurveyNavigation isValid={form.formState.isValid} />
    </div>
  )
}
