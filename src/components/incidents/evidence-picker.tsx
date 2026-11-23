"use client";

import { FileText, ImagePlus, Image as ImageIcon, Lock, X } from "lucide-react";
import { useId, useRef } from "react";
import { EVIDENCE_TYPES, evidenceProblem, MAX_EVIDENCE_FILES } from "@/lib/validation/incident";

export function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type EvidencePickerProps = {
  files: File[];
  onChange: (files: File[]) => void;
  /** Shown under the list, e.g. a file that was rejected. */
  error?: string;
  onError: (message?: string) => void;
  disabled?: boolean;
};

/** Lets the owner choose photos or PDFs; checks type and size before anything is uploaded. */
export function EvidencePicker({ files, onChange, error, onError, disabled }: EvidencePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errorId = useId();

  function add(list: FileList | null) {
    if (!list) return;
    const chosen = Array.from(list);
    const problem = chosen.map(evidenceProblem).find(Boolean);
    const accepted = chosen.filter((file) => !evidenceProblem(file));
    const next = [...files, ...accepted].slice(0, MAX_EVIDENCE_FILES);
    onChange(next);
    onError(
      problem ??
        (files.length + accepted.length > MAX_EVIDENCE_FILES
          ? `You can add up to ${MAX_EVIDENCE_FILES} files at a time.`
          : undefined),
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {files.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-line bg-paper p-3"
            >
              {file.type === "application/pdf" ? (
                <FileText aria-hidden className="size-5 shrink-0 text-danger" />
              ) : (
                <ImageIcon aria-hidden className="size-5 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-muted">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-danger-tint hover:text-danger"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface px-4 py-3 text-sm font-semibold text-primary hover:bg-primary-tint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
        <ImagePlus aria-hidden className="size-5" />
        Add photos or files
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={disabled}
          accept={EVIDENCE_TYPES.join(",")}
          aria-describedby={[hintId, error ? errorId : ""].filter(Boolean).join(" ")}
          onChange={(event) => add(event.target.files)}
          className="sr-only"
        />
      </label>
      <p id={hintId} className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <Lock aria-hidden className="size-3.5" />
        Photos or PDFs, up to 10 MB each. Private to your business and your assigned consultant.
      </p>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
