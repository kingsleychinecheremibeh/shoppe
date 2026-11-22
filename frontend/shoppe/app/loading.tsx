import { LogoMark } from "@/app/components/logo";

export default function Loading() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4" aria-busy="true">
      <LogoMark size={72} className="animate-bob" />
      <span className="font-mono text-xs font-semibold tracking-widest text-gray-600 uppercase">Loading</span>
    </main>
  );
}
