import { useState, useEffect } from "react";
import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../../shared/ui/alert";
import { WifiOff, WifiHigh, Loader2, Eye, EyeOff } from "lucide-react";
import { useNetworkStatus } from "../../shared/hooks/useNetworkStatus";
import { useUserStore } from "../../domain/auth/userStore";

interface LoginScreenProps {
  onLogin?: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const login = useUserStore((state) => state.login);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  // Nossos hooks de rede
  const { isOffline, isSlowConnection } = useNetworkStatus();

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estado para controlar mensagens se a autenticação estiver demorando
  const [isTakingTooLong, setIsTakingTooLong] = useState(false);

  // Assim que o loading acabar (sucesso ou erro), resetamos a mensagem de demora
  useEffect(() => {
    if (!isLoading) {
      setIsTakingTooLong(false);
    }
  }, [isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTakingTooLong(false);

    // Configura um timer de 8 segundos: se a request ainda não tiver resolvido, mostra o aviso
    const timeoutId = setTimeout(() => {
      setIsTakingTooLong(true);
    }, 8000);

    try {
      await login({ username: user, password });
      clearTimeout(timeoutId);
      if (onLogin) onLogin();
    } catch (err) {
      clearTimeout(timeoutId);
      console.log(err);
      // Error is handled by store and displayed below
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4 gap-4">
      {/* Avisos de Rede */}
      <div className="w-full max-w-sm space-y-2">
        {isOffline && (
          <Alert className="border-orange-500 bg-orange-50 text-orange-900 shadow-sm animate-in fade-in slide-in-from-top-4">
            <WifiOff className="h-4 w-4 !text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">
              Modo Offline
            </AlertTitle>
            <AlertDescription className="text-orange-800">
              Você está sem internet. O login pode falhar caso não tenhamos
              dados armazenados.
            </AlertDescription>
          </Alert>
        )}
        {!isOffline && isSlowConnection && (
          <Alert className="border-amber-500 bg-amber-50 text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-4">
            <WifiHigh className="h-4 w-4 !text-amber-600" />
            <AlertTitle className="text-amber-900 font-semibold">
              Conexão Lenta
            </AlertTitle>
            <AlertDescription className="text-amber-800">
              Sua rede parece estar lenta. O processo de entrada no sistema pode
              demorar um pouco mais.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Card
        className="w-full max-w-sm shadow-xl border-2"
        style={{ borderColor: "rgba(0, 128, 0, 0.1)" }}
      >
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #008000 0%, #00a000 100%)",
            }}
          >
            <img src="../logo_soda_cristal.png" alt="Logo Soda Cristal" />
          </div>
          <span className="text-xs text-gray-400 font-mono">v.13.04.00</span>
          <CardTitle className="text-2xl" style={{ color: "#008000" }}>
            Soda Cristal
          </CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema de entregas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                type="text"
                placeholder="user.example"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full shadow-md hover:shadow-lg transition-all duration-200"
              disabled={isLoading}
              style={{
                background: isLoading
                  ? "#6b7280"
                  : "linear-gradient(135deg, #008000 0%, #00a000 100%)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isTakingTooLong ? "Estabilizando..." : "Entrando..."}
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
            {isTakingTooLong && isLoading && (
              <p className="text-sm text-center text-amber-600 mt-2 animate-pulse font-medium">
                A rede está instável, aguarde a resposta do servidor...
              </p>
            )}
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
