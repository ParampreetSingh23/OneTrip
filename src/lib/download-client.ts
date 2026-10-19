/** Fetch an original for the share sheet; report bytes received and abort when the sheet closes. */
export async function fetchPhoto(url: string, signal: AbortSignal, onProgress: (bytes: number) => void) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Download failed (${response.status}). Please try again.`);
  if (!response.body) return response.blob();
  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      onProgress(loaded);
    }
    return new Blob(chunks);
  } finally {
    reader.releaseLock();
  }
}
