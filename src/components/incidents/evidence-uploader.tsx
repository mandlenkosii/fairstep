"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EvidencePicker } from "./evidence-picker";
import { uploadEvidence } from "./upload-evidence";

/** On the incident page: choose files, then upload them to this incident. */
export function EvidenceUploader({
  businessId,
  incidentId,
}: {
  businessId: string;
  incidentId: string;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);

  async function upload() {
    setUploading(true);
    const result = await uploadEvidence(businessId, incidentId, files);
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFiles([]);
    setError(undefined);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <EvidencePicker
        files={files}
        onChange={setFiles}
        error={error}
        onError={setError}
        disabled={uploading}
      />
      {files.length > 0 && (
        <Button type="button" onClick={upload} pending={uploading} className="self-start">
          {uploading
            ? "Uploading…"
            : `Upload ${files.length} ${files.length === 1 ? "file" : "files"}`}
        </Button>
      )}
    </div>
  );
}
