import { cn } from "@/lib/utils";

export function ServicesChartMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] min-h-[280px] rounded-3xl border border-white/12 bg-white/5 p-5 md:aspect-square md:min-h-0 md:p-6 lg:p-8",
        className,
      )}
    >
      <div className="flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 shadow-2xl backdrop-blur-xl md:gap-6">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-500/50" />
            <div className="size-2.5 rounded-full bg-amber-500/50" />
            <div className="size-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <div className="h-4 w-24 rounded-full bg-white/10" />
        </div>

        <div className="relative flex-1 px-4 pt-2 md:px-6 md:pt-4">
          <div className="space-y-1">
            <div className="h-3 w-16 rounded bg-sky-400/30" />
            <div className="h-8 w-32 rounded bg-white/10" />
          </div>

          <div className="relative mt-6 h-40 w-full px-2 md:mt-10 md:h-48 md:px-4">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 400 150" aria-hidden>
              <line x1="240" y1="0" x2="240" y2="150" stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              <text x="245" y="15" fill="white" fontSize="9" fontWeight="bold" opacity="0.4">
                BUGÜN
              </text>
              <path
                d="M0,120 Q40,100 80,110 T160,80 T240,95"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M0,122 Q40,98 80,113 T160,78 T240,93"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M240,93 Q320,60 400,70"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="8 4"
              />
              <circle cx="240" cy="93" r="4" fill="white" />
              <circle cx="400" cy="70" r="4" fill="#fbbf24" />
              <text x="10" y="145" fill="white" fontSize="9" fontWeight="bold" opacity="0.3">
                GEÇMİŞ VERİ
              </text>
              <text x="260" y="145" fill="#fbbf24" fontSize="9" fontWeight="bold" opacity="0.7">
                GELECEK ÖNGÖRÜSÜ
              </text>
            </svg>

            <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-white/5 pt-3 md:mt-10 md:gap-6 md:pt-4">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-3 bg-white" />
                <span className="text-[9px] font-bold uppercase text-white/50">Gerçek</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-3 bg-sky-400" />
                <span className="text-[9px] font-bold uppercase text-sky-400/70">Test</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-3 bg-[#fbbf24]" />
                <span className="text-[9px] font-bold uppercase text-[#fbbf24]">Tahmin</span>
              </div>
            </div>

            <div className="absolute right-0 top-0">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
                GÜVEN ARALIĞI: %95
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-around border-t border-white/10 bg-white/5 p-3 md:p-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-2 w-10 rounded-full bg-white/10" />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-4 -left-4 size-24 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-4 -top-4 size-32 rounded-full bg-purple-500/10 blur-3xl" />
    </div>
  );
}
