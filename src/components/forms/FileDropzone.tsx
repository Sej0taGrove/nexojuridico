"use client";

import { useId, useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";

import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  onBlur?: () => void;
  label: string;
  accept?: string;
  hint?: string;
  invalid?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  value,
  onChange,
  onBlur,
  label,
  accept = "application/pdf,image/jpeg,image/png",
  hint = "PDF, JPG o PNG · máx 5 MB",
  invalid,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0] ?? null;
    onChange(file);
    onBlur?.();
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-600"
          >
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {value.name}
            </p>
            <p className="text-xs text-gray-500">{formatBytes(value.size)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-danger-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          aria-label={`Quitar ${value.name}`}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
        dragOver
          ? "border-navy-500 bg-navy-50"
          : "border-gray-300 bg-white hover:border-navy-400 hover:bg-gray-50",
        invalid && "border-danger-500",
      )}
    >
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-full bg-navy-50 text-navy-600"
      >
        <UploadCloud className="size-5" />
      </span>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-500">
        Arrastra un archivo o{" "}
        <span className="font-medium text-navy-600">selecciónalo</span>
      </p>
      <p className="text-xs text-gray-400">{hint}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  );
}
