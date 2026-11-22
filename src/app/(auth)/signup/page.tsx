import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/auth-forms";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Start your free trial" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-headline-lg">Start your free trial</h1>
      <p className="mt-1 mb-6 text-muted">14 days free. No card needed.</p>
      <SignupForm action={signUp} />
      <p className="mt-4 text-xs text-muted">
        We only ask for what we need to set up your account. Your employees&apos; records stay
        private to your business and the consultant you choose.
      </p>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
          Log in
        </Link>
      </p>
    </>
  );
}
