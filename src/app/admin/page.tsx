'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Car, ClipboardList, FileText, LogOut, Loader2, Briefcase } from 'lucide-react';
import EmployeesTab from './components/EmployeesTab';
import ClientsTab from './components/ClientsTab';
import ChecklistTab from './components/ChecklistTab';
import ServicesTab from './components/ServicesTab';
import CargosTab from './components/CargosTab'; // Importando o novo componente

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.is_temporary_password) {
      router.push('/change-password');
    } else if (currentUser.role !== 'admin') {
      router.push('/employee');
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
              <h1 className="text-2xl font-bold text-red-500">Painel Administrativo</h1>
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
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-[#1a1a1a] border border-[#2a2a2a]">
            <TabsTrigger value="employees" className="data-[state=active]:bg-blue-600">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Funcionários</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-blue-600">
              <Car className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-blue-600">
              <ClipboardList className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-blue-600">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="cargos" className="data-[state=active]:bg-blue-600">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Cargos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeesTab />
          </TabsContent>

          <TabsContent value="clients">
            <ClientsTab />
          </TabsContent>

          <TabsContent value="checklist">
            <ChecklistTab />
          </TabsContent>

          <TabsContent value="services">
            <ServicesTab />
          </TabsContent>
          
          <TabsContent value="cargos">
            <CargosTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}