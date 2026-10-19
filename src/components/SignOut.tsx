"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.replace("/");
      }}
      className="rounded-md px-3 py-2 text-muted hover:text-ink"
    >
      Sign out
    </button>
  );
}
