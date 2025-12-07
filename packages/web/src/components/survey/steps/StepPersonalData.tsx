import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useWizard } from "../wizard/WizardContext";
import { personalDataSchema, type PersonalDataForm } from "@/lib/survey/schema";
import { SurveyNavigation } from "../wizard/SurveyNavigation";

export function StepPersonalData() {
  const { state, updatePersonalData, nextStep } = useWizard();

  const form = useForm<PersonalDataForm>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: state.data.personalData || {
      visitorName: "",
      visitorPhone: "",
      visitorEmail: "",
      visitorWhatsapp: "",
      referredBy: "",
    },
    mode: "onBlur",
  });

  const onSubmit = (data: PersonalDataForm) => {
    updatePersonalData(data);
    nextStep();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold leading-none mb-2">
              Cuéntanos sobre ti
            </h2>
            <p className="text-muted-foreground text-sm">
              Esta información nos ayuda a contactarte con tus resultados.
            </p>
          </div>

          <Form {...form}>
            <form
              id="personal-data-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="visitorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu nombre"
                        autoComplete="name"
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
                name="visitorPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="+52 123 456 7890"
                        autoComplete="tel"
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
                name="visitorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder="tu@email.com"
                        autoComplete="email"
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
                name="referredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Quién te invitó? (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de quien te refirió"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </div>

      <SurveyNavigation
        formId="personal-data-form"
        isValid={form.formState.isValid}
      />
    </div>
  );
}
