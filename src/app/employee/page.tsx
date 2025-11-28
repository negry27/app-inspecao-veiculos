'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Car, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployeePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.is_temporary_password) {
      router.push('/change-password');
    } else if (currentUser.role !== 'employee') {
      // Redireciona admins para o painel deles
      router.push('/admin');
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Painel do Funcionário</h1>
              <p className="text-sm text-gray-400">Bem-vindo, {user?.username}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-white mb-6">Ações Rápidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-blue-600 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-white">
                Iniciar Nova Inspeção
              </CardTitle>
              <Car className="h-6 w-6 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Comece o processo de inspeção e lavagem para um novo veículo.
              </p>
              <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
                Começar Inspeção
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-green-600 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-white">
                Ver Histórico de Serviços
              </CardTitle>
              <ClipboardList className="h-6 w-6 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Visualize e gerencie todos os serviços e relatórios concluídos.
              </p>
              <Button variant="outline" className="mt-4 w-full border-green-500/20 text-green-500 hover:bg-green-500/10">
                Ver Histórico
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}