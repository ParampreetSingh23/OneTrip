import { avatarLook } from "@/lib/avatar";

/** Generated avatar for a person ({ id, name }). Same id → same avatar everywhere. */
export default function Avatar({ person, size = 28, className = "" }: { person: { id: string; name: string }; size?: number; className?: string }) {
  const a = avatarLook(person.id, person.name);
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={`shrink-0 rounded-full ${className}`} role="img" aria-label={person.name}>
      <circle cx="20" cy="20" r="20" fill={a.bg} />
      <g transform={`rotate(${a.rotate} 20 20)`} fill={a.accent} opacity="0.9">
        {a.pattern === 0 && <circle cx="31" cy="9" r="11" />}
        {a.pattern === 1 && <rect x="-4" y="26" width="48" height="10" />}
        {a.pattern === 2 && <path d="M20 0 L40 0 L40 20 Z" />}
        {a.pattern === 3 && (
          <>
            <circle cx="8" cy="10" r="4" />
            <circle cx="32" cy="32" r="5" />
          </>
        )}
      </g>
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="600" fill="#0a0a0a" fontFamily="inherit">
        {a.initials}
      </text>
    </svg>
  );
}
