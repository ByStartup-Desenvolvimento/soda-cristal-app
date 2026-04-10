import { CloudUpload } from 'lucide-react';
import { useOutboxStore } from '../../domain/sync/outboxStore';

/** Aviso quando há mutações na fila (outbox) aguardando rede. */
export function PendingSyncBanner() {
  const pending = useOutboxStore((s) => s.items.length);
  if (pending === 0) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950"
    >
      <CloudUpload className="h-4 w-4 shrink-0 text-sky-700" aria-hidden />
      <span>
        {pending === 1
          ? '1 alteração aguardando envio ao servidor.'
          : `${pending} alterações aguardando envio ao servidor.`}{' '}
        Elas serão enviadas automaticamente ao reconectar.
      </span>
    </div>
  );
}
