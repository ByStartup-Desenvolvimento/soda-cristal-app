import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';


import { useUserStore } from '../../domain/auth/userStore';

interface LoginScreenProps {
  onLogin?: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const login = useUserStore((state) => state.login);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  // Removed local isLoading state

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({ username: user, password });
      if (onLogin) onLogin();
    } catch (err) {
      console.log(err);
      // Error is handled by store and displayed below
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl border-2" style={{ borderColor: 'rgba(0, 128, 0, 0.1)' }}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #008000 0%, #00a000 100%)' }}>
            <img src="./logo_soda_cristal.png" alt="Logo Soda Cristal" />
            {/* <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg> */}
          </div>
          <CardTitle className="text-2xl" style={{ color: '#008000' }}>Soda Cristal</CardTitle>
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
                type="user"
                placeholder="user.example"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all duration-200" disabled={isLoading} style={{ background: isLoading ? '#6b7280' : 'linear-gradient(135deg, #008000 0%, #00a000 100%)' }}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
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