// Pure helpers shared by client and server. Relative imports only (node --test).

export const EXPIRY_HOURS = { "24h": 24, "3d": 72, "7d": 168 } as const;
export type Expiry = keyof typeof EXPIRY_HOURS;

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  heif: "image/heif",
  webp: "image/webp",
};
export const ALLOWED_MIME = new Set(Object.values(EXT_MIME));

/** Browsers often report "" or octet-stream for HEIC; fall back to the extension. */
export function photoMime(filename: string, declared: string): string | null {
  if (ALLOWED_MIME.has(declared)) return declared;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? null;
}

/** Strip path parts and control chars; keep the name recognizable. */
export function safeFilename(name: string): string {
  const clean = name.split(/[\\/]/).pop()!.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return clean.slice(-200) || "photo";
}

/** "IMG_1.jpg" twice → "IMG_1.jpg", "IMG_1 (2).jpg". Case-insensitive, since most unzip targets are. */
export function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names.map((name) => {
    const dot = name.lastIndexOf(".");
    const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
    let candidate = name;
    for (let n = 2; seen.has(candidate.toLowerCase()); n++) candidate = `${base} (${n})${ext}`;
    seen.add(candidate.toLowerCase());
    return candidate;
  });
}
