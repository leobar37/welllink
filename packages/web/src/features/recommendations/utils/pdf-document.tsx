import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ClientRecommendations } from "../schema";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "2 solid #22c55e",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  clientInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
  },
  clientInfoItem: {
    fontSize: 10,
    color: "#4b5563",
  },
  section: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    borderBottom: "1 solid #e5e7eb",
    paddingBottom: 5,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  metricBox: {
    width: "30%",
    padding: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    textAlign: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16a34a",
  },
  metricLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 3,
  },
  list: {
    marginLeft: 10,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 15,
    color: "#22c55e",
  },
  listText: {
    flex: 1,
    color: "#374151",
  },
  supplementSection: {
    marginBottom: 10,
  },
  supplementTime: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 6,
    backgroundColor: "#e5e7eb",
    padding: 5,
    borderRadius: 4,
  },
  supplementItem: {
    flexDirection: "row",
    paddingLeft: 10,
    marginBottom: 4,
  },
  supplementName: {
    width: "35%",
    fontWeight: "bold",
    color: "#1f2937",
  },
  supplementDose: {
    width: "25%",
    color: "#6b7280",
  },
  supplementBenefit: {
    flex: 1,
    color: "#059669",
    fontStyle: "italic",
  },
  twoColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  column: {
    width: "48%",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tagGreen: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "4 8",
    borderRadius: 4,
    fontSize: 9,
  },
  tagRed: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "4 8",
    borderRadius: 4,
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#9ca3af",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 10,
  },
  note: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    fontSize: 9,
    color: "#92400e",
  },
});

interface RecommendationsPDFProps {
  data: ClientRecommendations;
  clientName: string;
  advisorName?: string;
  date: string;
}

export function RecommendationsPDF({
  data,
  clientName,
  advisorName = "Tu Asesor",
  date,
}: RecommendationsPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BIENVENIDO AL RETO DE 7 DIAS</Text>
          <Text style={styles.subtitle}>Proceso de Transformacion</Text>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientInfoItem}>Participante: {clientName}</Text>
          <Text style={styles.clientInfoItem}>Fecha: {date}</Text>
          <Text style={styles.clientInfoItem}>Asesor: {advisorName}</Text>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{data.wellnessScore?.overall || "--"}</Text>
            <Text style={styles.metricLabel}>Wellness Score</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{data.bmi?.current?.toFixed(1) || "--"}</Text>
            <Text style={styles.metricLabel}>IMC ({data.bmi?.category || ""})</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{data.hydration?.dailyLiters || "--"}L</Text>
            <Text style={styles.metricLabel}>Agua diaria</Text>
          </View>
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <Text style={styles.listText}>{data.summary}</Text>
          </View>
        )}

        {/* Hydration Schedule */}
        {data.hydration?.schedule && data.hydration.schedule.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hidratacion Diaria</Text>
            <View style={styles.list}>
              {data.hydration.schedule.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Supplements Routine */}
        {data.supplementsRoutine && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu Rutina Diaria del Reto</Text>

            {/* Morning */}
            {data.supplementsRoutine.morning && data.supplementsRoutine.morning.length > 0 && (
              <View style={styles.supplementSection}>
                <Text style={styles.supplementTime}>Al despertar (en ayunas)</Text>
                {data.supplementsRoutine.morning.map((item, index) => (
                  <View key={index} style={styles.supplementItem}>
                    <Text style={styles.supplementName}>{item.product}</Text>
                    <Text style={styles.supplementDose}>{item.dose}</Text>
                    <Text style={styles.supplementBenefit}>{item.benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Breakfast */}
            {data.supplementsRoutine.breakfast && data.supplementsRoutine.breakfast.length > 0 && (
              <View style={styles.supplementSection}>
                <Text style={styles.supplementTime}>Con el desayuno</Text>
                {data.supplementsRoutine.breakfast.map((item, index) => (
                  <View key={index} style={styles.supplementItem}>
                    <Text style={styles.supplementName}>{item.product}</Text>
                    <Text style={styles.supplementDose}>{item.dose}</Text>
                    <Text style={styles.supplementBenefit}>{item.benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Evening */}
            {data.supplementsRoutine.evening && data.supplementsRoutine.evening.length > 0 && (
              <View style={styles.supplementSection}>
                <Text style={styles.supplementTime}>Por la noche</Text>
                {data.supplementsRoutine.evening.map((item, index) => (
                  <View key={index} style={styles.supplementItem}>
                    <Text style={styles.supplementName}>{item.product}</Text>
                    <Text style={styles.supplementDose}>{item.dose}</Text>
                    <Text style={styles.supplementBenefit}>{item.benefit}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Diet - Two Columns */}
        {data.diet && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alimentacion Recomendada</Text>
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={{ ...styles.listText, fontWeight: "bold", marginBottom: 5 }}>
                  Incluir:
                </Text>
                <View style={styles.tagContainer}>
                  {data.diet.recommended?.map((item, index) => (
                    <Text key={index} style={styles.tagGreen}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.column}>
                <Text style={{ ...styles.listText, fontWeight: "bold", marginBottom: 5 }}>
                  Evitar:
                </Text>
                <View style={styles.tagContainer}>
                  {data.diet.avoid?.map((item, index) => (
                    <Text key={index} style={styles.tagRed}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
            {data.diet.mealFrequency && (
              <Text style={{ ...styles.listText, marginTop: 8 }}>
                Frecuencia: {data.diet.mealFrequency}
              </Text>
            )}
          </View>
        )}

        {/* Exercise */}
        {data.exercise && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actividad Fisica</Text>
            <View style={styles.list}>
              {data.exercise.type && (
                <View style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>Tipo: {data.exercise.type}</Text>
                </View>
              )}
              {data.exercise.intensity && (
                <View style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>Intensidad: {data.exercise.intensity}</Text>
                </View>
              )}
              {data.exercise.frequency && (
                <View style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>Frecuencia: {data.exercise.frequency}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Note */}
        <View style={styles.note}>
          <Text>
            Este es un plan orientativo. Consulta a tu medico si tienes dudas. Tu asesor te
            acompañara durante el reto.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>EXITO EN TU TRANSFORMACION!</Text>
        </View>
      </Page>
    </Document>
  );
}
