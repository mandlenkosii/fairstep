import { Logo } from "@/components/brand/logo";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Logo />
      <h1 className="text-display">FairStep</h1>
      <p className="text-muted">Every step fair. Every step on record.</p>
    </main>
  );
}
