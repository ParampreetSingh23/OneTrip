// Pure: deterministic avatar look from a seed (contributor id). Shared by server + client; relative imports only.

function hash(seed: string) {
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type AvatarLook = { bg: string; accent: string; pattern: 0 | 1 | 2 | 3; rotate: number; initials: string };

export function avatarLook(seed: string, name: string): AvatarLook {
  const h = hash(seed);
  const hue = h % 360;
  const words = name.trim().split(/\s+/).filter(Boolean).map((w) => [...w]); // whole characters, not UTF-16 halves
  const chars = words.length > 1 ? [words[0][0], words[words.length - 1][0]] : (words[0] ?? ["?"]).slice(0, 2);
  return {
    bg: `hsl(${hue} 70% 80%)`,
    accent: `hsl(${(hue + 40 + ((h >>> 9) % 140)) % 360} 65% 62%)`,
    pattern: ((h >>> 17) % 4) as AvatarLook["pattern"],
    rotate: (h >>> 20) % 360,
    initials: chars.join("").toUpperCase(),
  };
}
