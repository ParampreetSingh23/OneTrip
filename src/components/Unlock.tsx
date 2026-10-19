"use client";

import { useActionState } from "react";
import { unlock } from "@/app/a/[token]/actions";

export default function Unlock({ token }: { token: string }) {
  const [state, action, pending] = useActionState(unlock.bind(null, token), { error: null });

  return (
    <section className="flex flex-1 flex-col justify-center gap-6 py-12">
      <div className="space-y-2">
        <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-1.5px] text-ink">Password protected</h1>
        <p className="text-muted">Enter the password you got with this link.</p>
      </div>
      <form action={action} className="space-y-3">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-label="Password"
          aria-invalid={!!state.error}
          className="h-11 w-full rounded-md border border-hairline bg-canvas px-4 text-ink outline-none focus:border-ink"
        />
        {state.error && <p className="text-sm text-error" role="alert">{state.error}</p>}
        <button disabled={pending} className="h-12 w-full rounded-md bg-primary text-[15px] font-semibold text-white disabled:opacity-60">
          {pending ? "Checking…" : "Open album"}
        </button>
      </form>
    </section>
  );
}
