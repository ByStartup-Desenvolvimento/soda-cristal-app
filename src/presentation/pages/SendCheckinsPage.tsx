import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Route,
  Send,
  WifiOff,
} from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/ui/card";
import { Checkbox } from "../../shared/ui/checkbox";
import { toast } from "sonner";
import { useRotas } from "../hooks/useRotas";
import { useOutboxStore } from "../../domain/sync/outboxStore";
import { useDeliveryStore } from "../../domain/deliveries/deliveryStore";
import { useNetworkStore } from "../../shared/store/networkStore";
import { flushOutboxByRotaEntregaIds } from "../../domain/sync/flushOutbox";

interface SendCheckinsPageProps {
  onBack: () => void;
}

function mapStatusLabel(
  status?: string,
): "entregue" | "ausente-retornar" | "ausente-nao-consumir" | "nao-quis" {
  if (status === "delivered") return "entregue";
  if (status === "absent-return") return "ausente-retornar";
  if (status === "absent-no-return") return "ausente-nao-consumir";
  return "nao-quis";
}

export function SendCheckinsPage({ onBack }: SendCheckinsPageProps) {
  const [selectedRotaIds, setSelectedRotaIds] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);

  const {
    rotas,
    deliveriesPorRota,
    isLoading,
    isLoadingDeliveries,
    reload,
    offlineModeHint,
  } = useRotas();

  const outboxItems = useOutboxStore((state) => state.items);
  const deliveryStatuses = useDeliveryStore((state) => state.deliveryStatuses);
  const isOnline = useNetworkStore((state) => state.isOnline);

  const selectedRotaEntregaIds = useMemo(
    () =>
      selectedRotaIds.flatMap((rotaId) =>
        (deliveriesPorRota[rotaId] ?? []).map((item) => item.rotaentrega.id),
      ),
    [selectedRotaIds, deliveriesPorRota],
  );

  const summary = useMemo(() => {
    const selectedEntregaIds = new Set(selectedRotaEntregaIds);
    const selectedStatusEntries = Object.entries(deliveryStatuses).filter(
      ([entregaId]) => selectedEntregaIds.has(Number(entregaId)),
    );

    const totals = {
      totalClientes: selectedRotaEntregaIds.length,
      atendidos: selectedStatusEntries.length,
      entregue: 0,
      ausenteRetornar: 0,
      ausenteNaoConsumir: 0,
      naoQuis: 0,
    };

    selectedStatusEntries.forEach(([, status]) => {
      const label = mapStatusLabel(status.checkInStatus);
      if (label === "entregue") totals.entregue += 1;
      if (label === "ausente-retornar") totals.ausenteRetornar += 1;
      if (label === "ausente-nao-consumir") totals.ausenteNaoConsumir += 1;
      if (label === "nao-quis") totals.naoQuis += 1;
    });

    const pendingOutboxItems = outboxItems.filter((item) => {
      const rotaEntregaId =
        "body" in item.payload
          ? item.payload.body.rota_entrega
          : item.payload.rota_entrega;
      return selectedEntregaIds.has(rotaEntregaId);
    });

    return {
      ...totals,
      pendingOutboxCount: pendingOutboxItems.length,
    };
  }, [selectedRotaEntregaIds, deliveryStatuses, outboxItems]);

  function toggleRota(rotaId: number): void {
    setSelectedRotaIds((current) =>
      current.includes(rotaId)
        ? current.filter((id) => id !== rotaId)
        : [...current, rotaId],
    );
  }

  async function handleSendCheckins(): Promise<void> {
    if (selectedRotaEntregaIds.length === 0) {
      toast.error("Selecione ao menos uma rota para enviar os check-ins.");
      return;
    }

    setIsSending(true);
    try {
      const sentItems = await flushOutboxByRotaEntregaIds(
        selectedRotaEntregaIds,
      );
      if (sentItems > 0) {
        toast.success(`${sentItems} check-in(s) enviado(s) com sucesso.`);
        return;
      }

      if (!isOnline) {
        toast.info(
          "Sem conexão. Os check-ins pendentes continuarão na fila para sincronização automática.",
        );
        return;
      }

      toast.info("Não há check-ins pendentes para as rotas selecionadas.");
    } catch (error) {
      toast.error("Não foi possível enviar os check-ins agora.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background pb-16">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Enviar Check-in</h1>
            <p className="text-xs text-muted-foreground">
              Selecione as rotas e sincronize check-ins pendentes
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={reload}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading || isLoadingDeliveries ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4 pb-14">
        {!isOnline ? (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Sem conexão no momento.
            </div>
          </div>
        ) : null}

        {offlineModeHint ? (
          <div className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {offlineModeHint}
          </div>
        ) : null}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selecione a(s) rota(s)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rotas.map((rota) => {
              const selected = selectedRotaIds.includes(rota.id);
              const clientesDaRota = deliveriesPorRota[rota.id]?.length ?? 0;
              return (
                <button
                  key={rota.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition hover:bg-muted/30"
                  onClick={() => toggleRota(rota.id)}
                >
                  <Checkbox checked={selected} />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{rota.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {clientesDaRota} cliente(s) vinculados
                    </p>
                  </div>
                  <Route className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
            {rotas.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma rota disponível para seleção.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumo de atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Total de clientes selecionados:{" "}
              <strong>{summary.totalClientes}</strong>
            </p>
            <p>
              Atendimentos registrados hoje:{" "}
              <strong>{summary.atendidos}</strong>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <p>
                1. Visitado/Entregue: <strong>{summary.entregue}</strong>
              </p>
              <p>
                2. Ausente/Retornar: <strong>{summary.ausenteRetornar}</strong>
              </p>
              <p>
                3. Ausente/Não consumir:{" "}
                <strong>{summary.ausenteNaoConsumir}</strong>
              </p>
              <p>
                4. Não quis consumir: <strong>{summary.naoQuis}</strong>
              </p>
            </div>
            <p className="pt-2">
              Pendentes na fila offline:{" "}
              <strong>{summary.pendingOutboxCount}</strong>
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-white p-4 pb-24">
        <Button
          className="w-full gap-2"
          onClick={handleSendCheckins}
          disabled={isSending || selectedRotaIds.length === 0}
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando check-ins...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar Check-ins
            </>
          )}
        </Button>
        {!isSending && summary.pendingOutboxCount === 0 ? (
          <p className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sem pendências para envio no recorte atual
          </p>
        ) : null}
      </footer>
    </div>
  );
}
