// Browser-only upload helpers.

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: { body?: unknown; method?: string } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "POST",
    headers: { "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  return data as T;
}

/**
 * ~1024px JPEG preview (grid + lightbox) made in the browser. Canvas output drops EXIF (incl. GPS).
 * Returns null when this browser can't decode the file (e.g. HEIC outside Safari).
 */
export async function makeThumb(file: File, max = 1024): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** PUT to a presigned URL. XHR (not fetch) because only XHR reports upload progress. */
export function putFile(url: string, blob: Blob, contentType: string, onProgress?: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", contentType);
    if (onProgress) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Storage returned ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(blob);
  });
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
