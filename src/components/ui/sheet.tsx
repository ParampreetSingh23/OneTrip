"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Bottom sheet on phones, centered card on desktop. Native <dialog>: focus trap, Esc and
 * background inertness come from the browser.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // tap on backdrop
      className="m-0 mt-auto w-full max-w-none rounded-t-xl bg-canvas p-0 text-ink backdrop:bg-ink/50 sm:m-auto sm:max-w-md sm:rounded-xl motion-safe:animate-[sheet-in_200ms_ease-out]"
    >
      <div className="max-h-[85dvh] space-y-5 overflow-y-auto px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
              <path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
