const API_PREFIX = "/api/files";

interface InitResponse {
  upload_id: string;
  chunk_size: number;
  total_chunks: number;
}

interface UploadResult {
  file_id: string;
  filename: string;
  content_type: string;
}

async function ensureOk(response: Response): Promise<Response> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Upload failed (${response.status})`);
  }
  return response;
}

export async function uploadFileInChunks(
  file: File,
  onProgress?: (uploadedBytes: number, totalBytes: number) => void,
): Promise<UploadResult> {
  const initRes = await ensureOk(
    await fetch(`${API_PREFIX}/upload/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        file_size: file.size,
      }),
    }),
  );
  const init = (await initRes.json()) as InitResponse;

  let uploaded = 0;
  for (let chunkIndex = 0; chunkIndex < init.total_chunks; chunkIndex += 1) {
    const start = chunkIndex * init.chunk_size;
    const end = Math.min(file.size, start + init.chunk_size);
    const chunk = file.slice(start, end);
    await ensureOk(
      await fetch(`${API_PREFIX}/upload/${init.upload_id}/chunk/${chunkIndex}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk,
      }),
    );
    uploaded += end - start;
    onProgress?.(uploaded, file.size);
  }

  const completeRes = await ensureOk(
    await fetch(`${API_PREFIX}/upload/${init.upload_id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upload_id: init.upload_id }),
    }),
  );
  return (await completeRes.json()) as UploadResult;
}
