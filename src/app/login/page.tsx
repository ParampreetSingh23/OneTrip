import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import { auth, googleEnabled } from "@/lib/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Header />
      <Suspense>
        <SignedOutOnly />
      </Suspense>
    </main>
  );
}

/** Already signed in (session still valid) → skip the form. */
async function SignedOutOnly() {
  if (await auth.api.getSession({ headers: await headers() })) redirect("/dashboard");
  return <LoginForm google={googleEnabled} />;
}
