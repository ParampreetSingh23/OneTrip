"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/**
 * "Share QR" button + modal. Friends scan it with their camera and the collection opens.
 * `url` defaults to the current page (used on the collection page itself).
 */
export default function QrShare({
  url,
  title,
  className = "",
  label = "Share QR",
  ariaLabel,
}: {
  url?: string;
  title: string;
  className?: string;
  label?: React.ReactNode;
  ariaLabel?: string;
}) {
  const [qr, setQr] = useState<{ link: string; png: string } | null>(null);

  async function open() {
    const link = url ?? `${location.origin}${location.pathname}`;
    // White background + near-black modules scan best; M = tolerant of glare on a phone screen.
    const png = await QRCode.toDataURL(link, { width: 512, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0a0a0a", light: "#ffffff" } });
    setQr({ link, png });
  }

  useEffect(() => {
    if (!qr) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setQr(null);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [qr]);

  const fileName = `${title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "onetrip"} QR.png`;

  return (
    <>
      <button onClick={open} className={className} aria-label={ariaLabel} title={ariaLabel}>
        {label}
      </button>
      {qr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`QR code for ${title}`}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
          onClick={() => setQr(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-xl bg-canvas p-5 text-center">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold break-words text-ink">{title}</h2>
              <p className="text-sm text-muted">Scan with a phone camera to open the photos.</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
            <img src={qr.png} alt={`QR code linking to ${title}`} width={512} height={512} className="mx-auto aspect-square w-full max-w-72 rounded-lg" />
            <p className="text-xs text-muted">Anyone who scans this can open the collection, like the link. A password still applies if you set one.</p>
            <div className="grid grid-cols-2 gap-2">
              <a href={qr.png} download={fileName} className="inline-flex h-11 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
                Download QR
              </a>
              <button onClick={() => setQr(null)} className="h-11 rounded-md border border-hairline text-sm font-semibold text-ink">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Inline QR for a link + "Download QR". Used inside the Share / Collaborate panels. */
export function QrBlock({ link, title }: { link: string; title: string }) {
  const [png, setPng] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(link, { width: 512, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0a0a0a", light: "#ffffff" } }).then((p) => live && setPng(p));
    return () => {
      live = false;
    };
  }, [link]);
  const fileName = `${title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "onetrip"} QR.png`;
  return (
    <div className="flex items-center gap-4 rounded-lg border border-hairline p-3">
      {png ? (
        // eslint-disable-next-line @next/next/no-img-element -- generated data URL
        <img src={png} alt={`QR code for ${title}`} width={512} height={512} className="size-28 shrink-0 rounded-sm" />
      ) : (
        <div className="size-28 shrink-0 animate-pulse rounded-sm bg-surface-card" />
      )}
      <div className="space-y-2 text-sm">
        <p className="text-muted">Friends can scan this with their phone camera.</p>
        {png && (
          <a href={png} download={fileName} className="inline-flex h-10 items-center rounded-md border border-hairline px-3 font-semibold text-ink">
            Download QR
          </a>
        )}
      </div>
    </div>
  );
}
