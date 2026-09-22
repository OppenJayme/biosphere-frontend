import { LogoMark } from "@/components/layout/LogoMark";

export default function DashboardLoading() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-sage-200/50 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-forest-200/40 blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center gap-3">
        <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
          <LogoMark className="h-8 w-8 text-forest-700" />
        </span>
        <p className="text-sm font-medium text-zinc-500">Loading dashboard&hellip;</p>
      </div>
    </div>
  );
}
