import { recordEvidence } from "@/app/app/incidents/actions";
import { createClient } from "@/lib/supabase/client";
import { evidencePath, evidenceProblem, type EvidenceRecord } from "@/lib/validation/incident";

/**
 * Uploads evidence straight from the browser to the private "evidence" bucket
 * (storage rules allow only this business's owners), then asks the server to
 * record the files. Going direct avoids Vercel's 4.5 MB request limit.
 */
export async function uploadEvidence(
  businessId: string,
  incidentId: string,
  files: File[],
): Promise<{ error?: string }> {
  const problem = files.map(evidenceProblem).find(Boolean);
  if (problem) return { error: problem };

  const supabase = createClient();
  const records: EvidenceRecord[] = [];
  for (const file of files) {
    const path = evidencePath(businessId, incidentId, crypto.randomUUID(), file.name);
    const { error } = await supabase.storage
      .from("evidence")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) return { error: `${file.name} couldn't be uploaded. Please try again.` };
    records.push({
      path,
      fileName: file.name.slice(0, 200),
      mimeType: file.type as EvidenceRecord["mimeType"],
      size: file.size,
    });
  }
  return records.length ? recordEvidence(incidentId, records) : {};
}
