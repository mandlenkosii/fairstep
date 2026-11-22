import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/auth-forms";
import { logIn } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-headline-lg">Welcome back</h1>
      <p className="mt-1 mb-6 text-muted">Log in to manage your disciplinary cases.</p>
      <LoginForm action={logIn} />
      <p className="mt-6 text-center text-sm text-muted">
        New to FairStep?{" "}
        <Link href="/signup" className="font-semibold text-primary underline underline-offset-2">
          Start your 14-day free trial
        </Link>
      </p>
    </>
  );
}
