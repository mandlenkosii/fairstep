import { UserPlus, X } from "lucide-react";
import { assignConsultant, unassignConsultant } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";

type Person = { id: string; full_name: string };

/** Assign another consultant to a business, or remove one. */
export function ConsultantControls({
  businessId,
  businessName,
  assigned,
  consultants,
  returnTo,
}: {
  businessId: string;
  businessName: string;
  assigned: Person[];
  consultants: Person[];
  returnTo: string;
}) {
  const available = consultants.filter((c) => !assigned.some((a) => a.id === c.id));
  return (
    <div className="flex flex-col gap-2">
      {assigned.length === 0 && (
        <span className="text-sm font-semibold text-warning-strong">No consultant yet</span>
      )}
      {assigned.map((person) => (
        <form
          key={person.id}
          action={unassignConsultant.bind(null, returnTo, businessId, person.id)}
          className="flex items-center gap-1"
        >
          <span className="text-sm">{person.full_name}</span>
          <button
            type="submit"
            aria-label={`Remove ${person.full_name} from ${businessName}`}
            className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-danger-tint hover:text-danger"
          >
            <X aria-hidden className="size-4" />
          </button>
        </form>
      ))}
      {available.length > 0 && (
        <form action={assignConsultant.bind(null, returnTo)} className="flex flex-wrap gap-2">
          <input type="hidden" name="businessId" value={businessId} />
          <Select
            name="consultantId"
            defaultValue=""
            aria-label={`Consultant for ${businessName}`}
            className="min-w-40 flex-1"
          >
            <option value="">Choose consultant</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            <UserPlus aria-hidden className="size-4" />
            Assign
          </Button>
        </form>
      )}
    </div>
  );
}
