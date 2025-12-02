import type { HealthSurveyResponseData } from "../../db/schema/health-survey";

interface SurveyDataForPrompt {
  visitorName: string;
  responses: HealthSurveyResponseData;
}

export function buildRecommendationsPrompt(data: SurveyDataForPrompt): string {
  const { visitorName, responses } = data;
  const { measurements, conditions, habits } = responses;

  // Flatten all conditions into a list
  const allConditions: string[] = [];
  Object.entries(conditions).forEach(([category, items]) => {
    if (items && items.length > 0) {
      items.forEach((item: string) => {
        allConditions.push(`${item} (${category})`);
      });
    }
  });

  const conditionsList =
    allConditions.length > 0
      ? allConditions.join(", ")
      : "No reporta condiciones de salud";

  return `Eres un experto en nutrición y bienestar especializado en el programa Herbalife de 7 días.
Analiza los siguientes datos de la encuesta de salud y genera recomendaciones personalizadas.

## DATOS DEL PARTICIPANTE

**Nombre:** ${visitorName}

**Medidas:**
- Peso: ${measurements.weight} kg
- Estatura: ${measurements.height} cm
- Edad: ${measurements.age} años

**Condiciones de Salud Reportadas:**
${conditionsList}

**Hábitos:**
- Consumo de agua: ${habits.waterIntake}
- ¿Entrena?: ${habits.training === "yes" ? "Sí" : habits.training === "no" ? "No" : "A veces"}
- ¿Se alimenta bien?: ${habits.nutrition === "yes" ? "Sí" : habits.nutrition === "no" ? "No" : "Regular"}
${habits.familyHistory ? `- Historial familiar: ${habits.familyHistory}` : ""}

## PRODUCTOS HERBALIFE DISPONIBLES PARA EL RETO

**En ayunas (mañana):**
1. Herbal Aloe Concentrate - Digestión, absorción de nutrientes
2. Fibra Activa - Tránsito intestinal, saciedad
3. Collagen Skin Booster - Piel, cabello, uñas
4. NRG - Energía natural (guaraná, té verde)
5. Té Herbal Concentrate - Metabolismo, antioxidantes

**Con desayuno:**
1. Proteína PDM - Desarrollo muscular, saciedad
2. Multivitamínico - Vitaminas y minerales esenciales
3. Omega 3 - Salud cardiovascular

## INSTRUCCIONES

Genera dos bloques de información:

### 1. clientRecommendations (Para el cliente - se incluirá en el PDF)
- Calcula IMC y peso saludable
- Calcula hidratación basada en peso (fórmula: peso * 35ml, ajustar por ejercicio)
- Prioriza las condiciones por severidad
- Recomienda dieta específica según condiciones
- Sugiere ejercicio apropiado
- Calcula wellness score (0-100)
- Identifica factores de riesgo
- Personaliza la rutina de suplementos según las condiciones

### 2. advisorNotes (Para el asesor - NO se incluye en el PDF)
- Precauciones específicas con este cliente
- Plan día a día para los 7 días del reto
- Temas de conversación sugeridos
- Metas realistas para este perfil
- Señales de alerta a monitorear
- Calendario de seguimiento

## REGLAS IMPORTANTES

1. Todas las respuestas deben ser en ESPAÑOL
2. Sé específico y personalizado basándote en los datos
3. Si hay condiciones graves (presión alta, diabetes), incluye precauciones
4. El wellness score debe reflejar realísticamente las condiciones
5. Las notas del asesor deben ser prácticas y accionables
6. Relaciona los suplementos con las condiciones específicas del usuario
7. Si el usuario tiene problemas digestivos, ajusta la rutina (ej: tomar después del desayuno, no en ayunas)`;
}
