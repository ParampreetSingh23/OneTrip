"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";

const input = "h-11 w-full rounded-md border border-hairline bg-canvas px-4 text-ink outline-none focus:border-ink";

export default function LoginForm({ google }: { google: boolean }) {
  const rawNext = useSearchParams().get("next");
  const next = () => safeNext(rawNext, location.origin); // no open redirects (//x, /\x, …)
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(form: FormData) {
    setPending(true);
    setError(null);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const { error } =
      mode === "in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: String(form.get("name")) });
    if (error) {
      setError(error.message ?? "Something went wrong");
      setPending(false);
    } else {
      location.assign(next()); // full load so server components see the new cookie
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-8">
      <div className="space-y-2">
        <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-1.5px] text-ink">
          {mode === "in" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-muted">Only you need an account. People you share with just open the link.</p>
      </div>

      {google && (
        <>
          <button
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next() })}
            className="flex h-12 items-center justify-center gap-2 rounded-md border border-hairline bg-canvas text-[15px] font-semibold text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
              <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1A11 11 0 0 0 1 12c0 1.8.4 3.5 1.1 4.9L5.8 14z" />
              <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7.1L5.8 10C6.7 7.3 9.1 5.4 12 5.4z" />
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted-soft">
            <span className="h-px flex-1 bg-hairline" />
            or
            <span className="h-px flex-1 bg-hairline" />
          </div>
        </>
      )}

      <form action={submit} className="space-y-3">
        {mode === "up" && <input name="name" required autoComplete="name" placeholder="Your name" aria-label="Name" className={input} />}
        <input name="email" type="email" required autoComplete="email" placeholder="Email" aria-label="Email" className={input} />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          placeholder={mode === "in" ? "Password" : "Password (8+ characters)"}
          aria-label="Password"
          className={input}
        />
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <button disabled={pending} className="h-12 w-full rounded-md bg-primary text-[15px] font-semibold text-white disabled:opacity-60">
          {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(null); }} className="text-sm text-muted">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </section>
  );
}
