'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { initializeDatabase } from '@/lib/init-db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Inicializar banco de dados ao carregar a página de login
    const init = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error('Erro ao inicializar banco:', error);
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(username, password);

      if (result.success && result.user) {
        toast.success('Login realizado com sucesso!');
        
        // Redirecionar baseado no tipo de usuário
        if (result.user.is_temporary_password) {
          router.push('/change-password');
        } else if (result.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/employee');
        }
      } else {
        toast.error(result.error || 'Erro ao fazer login');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-gray-400 text-sm">Inicializando sistema...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] p-4">
      <Card className="w-full max-w-md bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Sistema de Inspeção</CardTitle>
          <CardDescription className="text-gray-400">
            Entre com suas credenciais para acessar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">E-mail ou Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu e-mail ou usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-400 text-center">
              💡 Primeiro acesso? Use as credenciais fornecidas pelo administrador
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
