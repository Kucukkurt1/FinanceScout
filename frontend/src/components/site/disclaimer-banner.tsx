import { AlertTriangle } from "lucide-react";

export function DisclaimerBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ${className}`}
    >
      <AlertTriangle className="size-5 shrink-0 text-amber-400" aria-hidden />
      <p>
        <strong className="text-amber-50">Bilgilendirme:</strong> FinanceScout yatırım tavsiyesi vermez.
        Tahminler varsayımsal modellere dayanır; geçmiş performans geleceği garanti etmez.
      </p>
    </div>
  );
}
