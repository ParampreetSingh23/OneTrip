import { avatarLook } from "../../src/lib/avatar.ts";
import { writeFileSync } from "node:fs";
const people = { owner: "Sam", c_riya_8f2: "Riya", c_arjun_3k9: "Arjun" };
const out: Record<string, string> = {};
for (const [id, name] of Object.entries(people)) {
  const a = avatarLook(id, name);
  const pat = [`<circle cx="31" cy="9" r="11"/>`, `<rect x="-4" y="26" width="48" height="10"/>`, `<path d="M20 0 L40 0 L40 20 Z"/>`, `<circle cx="8" cy="10" r="4"/><circle cx="32" cy="32" r="5"/>`][a.pattern];
  out[name] = `<svg viewBox="0 0 40 40" width="SIZE" height="SIZE" class="shrink-0 rounded-full"><circle cx="20" cy="20" r="20" fill="${a.bg}"/><g transform="rotate(${a.rotate} 20 20)" fill="${a.accent}" opacity="0.9">${pat}</g><text x="20" y="21" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="600" fill="#0a0a0a">${a.initials}</text></svg>`;
}
writeFileSync(new URL("./avatars.json", import.meta.url), JSON.stringify(out));
