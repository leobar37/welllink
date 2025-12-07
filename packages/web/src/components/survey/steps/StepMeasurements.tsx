import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useWizard } from "../wizard/WizardContext";
import { measurementsSchema, type MeasurementsForm } from "@/lib/survey/schema";
import { SurveyNavigation } from "../wizard/SurveyNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

// BMI Info Component
function BMIInfoContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        El Índice de Masa Corporal (IMC) es una medida que relaciona tu peso con
        tu estatura. Es una herramienta útil para evaluar si tu peso está dentro
        de un rango saludable.
      </p>

      <div className="space-y-3">
        <h4 className="font-medium text-sm">Categorías del IMC (adultos):</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
            <span className="font-medium">Bajo peso</span>
            <span className="text-yellow-600 dark:text-yellow-500">
              &lt; 18.5
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
            <span className="font-medium">Peso saludable</span>
            <span className="text-green-600 dark:text-green-500">
              18.5 - 24.9
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
            <span className="font-medium">Sobrepeso</span>
            <span className="text-yellow-600 dark:text-yellow-500">
              25 - 29.9
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md">
            <span className="font-medium">Obesidad (Grado I)</span>
            <span className="text-orange-600 dark:text-orange-500">
              30 - 34.9
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
            <span className="font-medium">Obesidad (Grado II)</span>
            <span className="text-red-600 dark:text-red-500">35 - 39.9</span>
          </div>

          <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
            <span className="font-medium">Obesidad (Grado III)</span>
            <span className="text-red-600 dark:text-red-500">≥ 40</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
        <p className="text-xs text-blue-900 dark:text-blue-300">
          <strong>Nota importante:</strong> El IMC es una guía general y no
          considera factores como la masa muscular, la edad o el sexo. Consulta
          con un profesional de la salud para una evaluación personalizada.
        </p>
      </div>
    </div>
  );
}

export function StepMeasurements() {
  const { state, updateMeasurements, nextStep } = useWizard();
  const isMobile = useIsMobile();
  const [openBMIInfo, setOpenBMIInfo] = useState(false);

  // Local state for input display values (allows empty string while typing)
  const [displayValues, setDisplayValues] = useState({
    weight: state.data.measurements?.weight?.toString() || "",
    height: state.data.measurements?.height?.toString() || "",
    age: state.data.measurements?.age?.toString() || "",
  });

  const form = useForm<MeasurementsForm>({
    resolver: zodResolver(measurementsSchema),
    defaultValues: state.data.measurements || {
      weight: 0,
      height: 0,
      age: 0,
    },
    mode: "onBlur",
  });

  const onSubmit = (data: MeasurementsForm) => {
    updateMeasurements(data);
    nextStep();
  };

  // Calculate BMI if both weight and height are available
  const weight = form.watch("weight");
  const height = form.watch("height");
  const bmi =
    weight > 0 && height > 0 ? (weight / (height / 100) ** 2).toFixed(1) : null;

  const getBMICategory = (bmi: number): { label: string; color: string } => {
    if (bmi < 18.5) return { label: "Bajo peso", color: "text-yellow-600" };
    if (bmi < 25) return { label: "Peso saludable", color: "text-green-600" };
    if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-600" };
    return { label: "Área de oportunidad", color: "text-orange-600" };
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold leading-none mb-2">
              Tus medidas actuales
            </h2>
            <p className="text-muted-foreground text-sm">
              Estos datos nos ayudan a entender mejor tu situación.
            </p>
          </div>

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
                            const value = e.target.value;
                            // Allow empty string or valid decimal numbers
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              setDisplayValues((prev) => ({
                                ...prev,
                                weight: value,
                              }));
                              const numValue = parseFloat(value);
                              field.onChange(isNaN(numValue) ? 0 : numValue);
                            }
                          }}
                          onBlur={() => {
                            field.onBlur();
                            // Format display on blur if empty
                            if (displayValues.weight === "") {
                              setDisplayValues((prev) => ({
                                ...prev,
                                weight: "0",
                              }));
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
                            const value = e.target.value;
                            // Allow empty string or valid integers
                            if (value === "" || /^\d*$/.test(value)) {
                              setDisplayValues((prev) => ({
                                ...prev,
                                height: value,
                              }));
                              const numValue = parseInt(value);
                              field.onChange(isNaN(numValue) ? 0 : numValue);
                            }
                          }}
                          onBlur={() => {
                            field.onBlur();
                            if (displayValues.height === "") {
                              setDisplayValues((prev) => ({
                                ...prev,
                                height: "0",
                              }));
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
                            const value = e.target.value;
                            // Allow empty string or valid integers
                            if (value === "" || /^\d*$/.test(value)) {
                              setDisplayValues((prev) => ({
                                ...prev,
                                age: value,
                              }));
                              const numValue = parseInt(value);
                              field.onChange(isNaN(numValue) ? 0 : numValue);
                            }
                          }}
                          onBlur={() => {
                            field.onBlur();
                            if (displayValues.age === "") {
                              setDisplayValues((prev) => ({
                                ...prev,
                                age: "0",
                              }));
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Tu IMC
                      </span>
                      {isMobile ? (
                        <Drawer
                          open={openBMIInfo}
                          onOpenChange={setOpenBMIInfo}
                        >
                          <DrawerTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-5 w-5 p-0"
                            >
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent>
                            <DrawerHeader>
                              <DrawerTitle>¿Qué es el IMC?</DrawerTitle>
                              <DrawerDescription>
                                Información sobre el Índice de Masa Corporal
                              </DrawerDescription>
                            </DrawerHeader>
                            <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
                              <BMIInfoContent />
                            </div>
                            <DrawerFooter>
                              <DrawerClose asChild>
                                <Button variant="outline">Cerrar</Button>
                              </DrawerClose>
                            </DrawerFooter>
                          </DrawerContent>
                        </Drawer>
                      ) : (
                        <Sheet open={openBMIInfo} onOpenChange={setOpenBMIInfo}>
                          <SheetTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-5 w-5 p-0"
                            >
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent
                            side="right"
                            className="w-full sm:max-w-lg overflow-y-auto"
                          >
                            <SheetHeader>
                              <SheetTitle>¿Qué es el IMC?</SheetTitle>
                              <SheetDescription>
                                Información sobre el Índice de Masa Corporal
                              </SheetDescription>
                            </SheetHeader>
                            <div className="mt-4">
                              <BMIInfoContent />
                            </div>
                          </SheetContent>
                        </Sheet>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold">{bmi}</span>
                      <span
                        className={`ml-2 text-sm ${getBMICategory(parseFloat(bmi)).color}`}
                      >
                        {getBMICategory(parseFloat(bmi)).label}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>

      <SurveyNavigation
        formId="measurements-form"
        isValid={form.formState.isValid}
      />
    </div>
  );
}
