const API_PREFIX = "/api";

interface ConversionRequest {
  file_id: string;
  source_format: string;
  target_format: string;
}

interface ConversionResponse {
  job_id: string;
  status: string;
}

export interface JobStatusResponse {
  job_id: string;
  file_id: string;
  source_format: string;
  target_format: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  download_url: string;
}

export interface CapabilitiesResponse {
  plugins: string[];
  conversions: Array<{
    plugin: string;
    input_mime: string;
    output_mime: string;
  }>;
  operations: string[];
}

async function ensureOk(response: Response): Promise<Response> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return response;
}

export async function createConversion(payload: ConversionRequest): Promise<ConversionResponse> {
  const response = await ensureOk(
    await fetch(`${API_PREFIX}/conversions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  return (await response.json()) as ConversionResponse;
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await ensureOk(await fetch(`${API_PREFIX}/jobs/${jobId}`));
  return (await response.json()) as JobStatusResponse;
}

export async function getCapabilities(): Promise<CapabilitiesResponse> {
  const response = await ensureOk(await fetch(`${API_PREFIX}/conversions/capabilities`));
  return (await response.json()) as CapabilitiesResponse;
}
