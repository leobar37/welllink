import type { AdvisorNotes } from "../schema";
import { PrecautionsCard } from "./PrecautionsCard";
import { WeeklyPlanCard } from "./WeeklyPlanCard";
import { ConversationTopicsCard } from "./ConversationTopicsCard";
import { AlertSignsCard } from "./AlertSignsCard";
import { RealisticGoalsCard } from "./RealisticGoalsCard";
import { FollowUpScheduleCard } from "./FollowUpScheduleCard";

interface AdvisorTabProps {
  data?: AdvisorNotes;
}

export function AdvisorTab({ data }: AdvisorTabProps) {
  return (
    <div className="space-y-6">
      {/* Private Notice */}
      <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <span>🔒</span>
          <span className="text-sm font-medium">
            Información privada - No se incluye en el PDF
          </span>
        </div>
      </div>

      {/* Critical Info Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <PrecautionsCard data={data?.precautions} />
        <AlertSignsCard data={data?.alertSigns} />
      </div>

      {/* Weekly Plan - Full Width */}
      <WeeklyPlanCard data={data?.weeklyPlan} />

      {/* Goals and Topics Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <RealisticGoalsCard data={data?.realisticGoals} />
        <ConversationTopicsCard data={data?.conversationTopics} />
      </div>

      {/* Follow-up Schedule */}
      <FollowUpScheduleCard data={data?.followUpSchedule} />
    </div>
  );
}
