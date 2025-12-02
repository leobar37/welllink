import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useWizard } from "../wizard/WizardContext";
import { habitsSchema, type HabitsForm } from "@/lib/survey/schema";
import { RadioCardGroup } from "../ui/RadioCard";
import { SurveyNavigation } from "../wizard/SurveyNavigation";
import { TRAINING_OPTIONS, NUTRITION_OPTIONS } from "@/lib/survey/constants";

export function StepHabits() {
  const { state, updateHabits, nextStep } = useWizard();

  const form = useForm<HabitsForm>({
    resolver: zodResolver(habitsSchema),
    defaultValues: state.data.habits || {
      waterIntake: "",
      training: undefined,
      nutrition: undefined,
      familyHistory: "",
    },
    mode: "onBlur",
  });

  const onSubmit = (data: HabitsForm) => {
    updateHabits(data);
    nextStep();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <Card className="max-w-lg mx-auto border-0 shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-xl">Tus hábitos diarios</CardTitle>
            <CardDescription>
              Cuéntanos sobre tu estilo de vida actual.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            <Form {...form}>
              <form
                id="habits-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="waterIntake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Cuánta agua tomas al día? *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 2 litros, 8 vasos..."
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="training"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Estás entrenando? *</FormLabel>
                      <FormControl>
                        <RadioCardGroup
                          options={TRAINING_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          name="training"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nutrition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Te alimentas bien? *</FormLabel>
                      <FormControl>
                        <RadioCardGroup
                          options={NUTRITION_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          name="nutrition"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="familyHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Historial de salud familiar (opcional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: diabetes, presión alta, problemas del corazón..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        ¿Hay algo en tu familia que debamos saber?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <SurveyNavigation formId="habits-form" isValid={form.formState.isValid} />
    </div>
  );
}
