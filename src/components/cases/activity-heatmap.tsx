import { Card, CardTitle } from "@/components/ui/card";
import { activityGrid, activityLevel } from "@/lib/cases/activity";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

const SHADE = [
  "bg-paper ring-1 ring-line",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/70",
  "bg-primary",
];
const WEEKS = 12;

/** Twelve weeks of record-keeping: one square per day, darker on busier days. */
export function ActivityHeatmap({ timestamps }: { timestamps: string[] }) {
  const { weeks, total, max } = activityGrid(timestamps, new Date(), WEEKS);
  return (
    <Card>
      <CardTitle>Your record</CardTitle>
      <p className="mt-1 text-sm text-muted">
        {total} {total === 1 ? "thing" : "things"} put on record in the last {WEEKS} weeks.
      </p>
      <div
        className="mt-4 flex gap-1"
        role="img"
        aria-label={`Activity over ${WEEKS} weeks: ${total} records.`}
      >
        {weeks.map((week) => (
          <div key={week[0].date} className="flex flex-1 flex-col gap-1">
            {week.map((day) => (
              <span
                key={day.date}
                title={day.future ? undefined : `${formatDate(day.date)}: ${day.count}`}
                className={cn(
                  "aspect-square w-full rounded-[3px]",
                  day.future ? "bg-transparent" : SHADE[activityLevel(day.count, max)],
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-3 flex items-center justify-end gap-1 text-xs text-muted">
        Less
        {SHADE.map((shade) => (
          <span key={shade} className={cn("size-2.5 rounded-[2px]", shade)} />
        ))}
        More
      </div>
    </Card>
  );
}
