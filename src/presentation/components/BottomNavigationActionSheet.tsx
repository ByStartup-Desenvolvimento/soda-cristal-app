import { type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  FileUp,
  Handshake,
  PlusCircle,
  Route,
  Send,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../shared/ui/sheet";

interface BottomNavigationActionSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MenuAction {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}

export function BottomNavigationActionSheet({
  isOpen,
  onOpenChange,
}: BottomNavigationActionSheetProps) {
  const navigate = useNavigate();

  function navigateAndClose(path: string): void {
    onOpenChange(false);
    navigate(path);
  }

  function showNotImplementedFeature(label: string): void {
    onOpenChange(false);
    toast.info(`${label} será disponibilizado em breve.`);
  }

  const actions: MenuAction[] = [
    {
      id: "rotas",
      label: "Rotas",
      icon: Route,
      onClick: () => navigateAndClose("/routes"),
    },
    {
      id: "checkin",
      label: "Enviar Check-in",
      icon: Send,
      onClick: () => navigateAndClose("/checkins/send"),
    },
    {
      id: "enviados",
      label: "Enviados",
      icon: ClipboardList,
      onClick: () => showNotImplementedFeature("Enviados"),
    },
    {
      id: "cadastro",
      label: "Cadastrar Cliente",
      icon: PlusCircle,
      onClick: () => navigateAndClose("/customers/new"),
    },
    {
      id: "contratos",
      label: "Pendência Contratos",
      icon: Handshake,
      onClick: () => navigateAndClose("/contracts"),
    },
    {
      id: "clientes",
      label: "Enviar Clientes",
      icon: FileUp,
      onClick: () => showNotImplementedFeature("Enviar Clientes"),
    },
    {
      id: "xarope",
      label: "Venda Xarope",
      icon: ShoppingCart,
      onClick: () => navigateAndClose("/pdv"),
    },
    {
      id: "entregas",
      label: "Entregas",
      icon: Truck,
      onClick: () => navigateAndClose("/deliveries"),
    },
  ];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[90%] max-w-sm p-0">
          <SheetHeader className="border-b bg-primary p-4 text-left">
            <SheetTitle className="text-white border border-white p-2 rounded-md w-fit">
              Menu do vendedor
            </SheetTitle>
            <SheetDescription className="text-white ">
              Acesse rapidamente as ações operacionais do dia
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  className="h-14 justify-start rounded-none border-b px-4 text-sm font-normal"
                  onClick={action.onClick}
                >
                  <Icon className="mr-3 h-4 w-4 text-primary" />
                  {action.label}
                </Button>
              );
            })}

          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
