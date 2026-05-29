const API_PREFIX = "/api";
async function ensureOk(response) {
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Request failed (${response.status})`);
    }
    return response;
}
export async function createConversion(payload) {
    const response = await ensureOk(await fetch(`${API_PREFIX}/conversions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    }));
    return (await response.json());
}
export async function getJobStatus(jobId) {
    const response = await ensureOk(await fetch(`${API_PREFIX}/jobs/${jobId}`));
    return (await response.json());
}
export async function getCapabilities() {
    const response = await ensureOk(await fetch(`${API_PREFIX}/conversions/capabilities`));
    return (await response.json());
}
