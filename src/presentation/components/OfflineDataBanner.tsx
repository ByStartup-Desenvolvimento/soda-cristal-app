import { WifiOff } from 'lucide-react';

interface OfflineDataBannerProps {
  message: string;
  className?: string;
}

/** Banner discreto quando há dados em cache sem rede ou após falha de transporte. */
export function OfflineDataBanner({ message, className = '' }: OfflineDataBannerProps) {
  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 ${className}`}
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
