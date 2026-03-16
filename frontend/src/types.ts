export type ToolCategory = "PDF" | "Office" | "Image" | "Media" | "Data" | "Archive";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface ConversionOperation {
  id: string;
  name: string;
  category: ToolCategory;
  accepts: string[];
  outputs: string[];
  options: OptionSchema[];
}

export type OptionType = "boolean" | "select" | "number";

export interface OptionSchema {
  key: string;
  label: string;
  type: OptionType;
  ariaLabel: string;
  min?: number;
  max?: number;
  defaultValue: boolean | string | number;
  choices?: string[];
}

export interface ConversionJob {
  id: string;
  operationId: string;
  sourceFileName: string;
  outputFormat: string;
  progress: number;
  status: JobStatus;
  error?: string;
  startedAt: number;
  resultUrl?: string;
  previewUrl?: string;
}
