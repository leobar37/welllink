import type { AdvisorNotes } from "../schema";
import { PrecautionsCard } from "./PrecautionsCard";
import { WeeklyPlanCard } from "./WeeklyPlanCard";
import { ConversationTopicsCard } from "./ConversationTopicsCard";
import { AlertSignsCard } from "./AlertSignsCard";
import { RealisticGoalsCard } from "./RealisticGoalsCard";
import { FollowUpScheduleCard } from "./FollowUpScheduleCard";
import { SectionNav } from "./SectionNav";
import { ADVISOR_SECTIONS } from "../constants";

interface AdvisorTabProps {
  data?: AdvisorNotes;
}

export function AdvisorTab({ data }: AdvisorTabProps) {
  return (
    <div className="space-y-4">
      {/* Sticky Section Navigation */}
      <SectionNav sections={ADVISOR_SECTIONS} />

      {/* Private Notice */}
      <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <span>🔒</span>
          <span className="text-sm font-medium">
            Información privada - No se incluye en el PDF
          </span>
        </div>
      </div>

      {/* Alerts Section */}
      <section id="advisor-alerts" className="scroll-mt-16 pt-2 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <span>⚠️</span> Alertas y Precauciones
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <PrecautionsCard data={data?.precautions} />
          <AlertSignsCard data={data?.alertSigns} />
        </div>
      </section>

      {/* Plan Section */}
      <section id="advisor-plan" className="scroll-mt-16 pt-2 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <span>📅</span> Plan de Seguimiento
        </h3>
        <WeeklyPlanCard data={data?.weeklyPlan} />
        <FollowUpScheduleCard data={data?.followUpSchedule} />
      </section>

      {/* Goals Section */}
      <section id="advisor-goals" className="scroll-mt-16 pt-2 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <span>🎯</span> Metas y Conversación
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RealisticGoalsCard data={data?.realisticGoals} />
          <ConversationTopicsCard data={data?.conversationTopics} />
        </div>
      </section>
    </div>
  );
}
