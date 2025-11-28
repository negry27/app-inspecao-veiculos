'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase, Client, Vehicle, Service } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';

// Tipos auxiliares para o estado
interface ClientWithVehicles extends Client {
  vehicles: Vehicle[];
}

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientWithVehicles[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'employee') {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadClientsAndVehicles();
  }, [router]);

  const loadClientsAndVehicles = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*, vehicles(*)')
        .order('name', { ascending: true });

      if (clientsError) throw clientsError;

      setClients(clientsData as ClientWithVehicles[] || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar clientes e veículos.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInspection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId || !selectedVehicleId) {
      toast.error('Por favor, selecione um cliente e um veículo.');
      return;
    }

    if (!currentUser) {
      toast.error('Usuário não autenticado.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Criar um novo registro de serviço
      const newServiceData: Partial<Service> = {
        employee_id: currentUser.id,
        client_id: selectedClientId,
        vehicle_id: selectedVehicleId,
        checklist_data: {}, // Inicialmente vazio
        photos: [],
        created_at: new Date().toISOString(),
      };

      const { data: serviceResult, error } = await supabase
        .from('services')
        .insert([newServiceData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Inspeção iniciada com sucesso!');
      
      // 2. Redirecionar para a página de preenchimento do checklist
      router.push(`/employee/service/${serviceResult.id}/checklist`);

    } catch (error: any) {
      console.error('Erro ao iniciar inspeção:', error);
      toast.error(error.message || 'Erro ao iniciar inspeção.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableVehicles = clients.find(c => c.id === selectedClientId)?.vehicles || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-white hidden sm:block">Nova Inspeção</h1>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              Selecione Cliente e Veículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartInspection} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="client-select" className="text-gray-300">Cliente</Label>
                <Select 
                  value={selectedClientId} 
                  onValueChange={(value) => {
                    setSelectedClientId(value);
                    setSelectedVehicleId(''); // Reset vehicle selection
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger id="client-select" className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle-select" className="text-gray-300">Veículo</Label>
                <Select 
                  value={selectedVehicleId} 
                  onValueChange={setSelectedVehicleId}
                  disabled={!selectedClientId || submitting || availableVehicles.length === 0}
                >
                  <SelectTrigger id="vehicle-select" className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                    <SelectValue placeholder={selectedClientId ? (availableVehicles.length > 0 ? "Selecione o veículo" : "Nenhum veículo cadastrado para este cliente") : "Selecione um cliente primeiro"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} - {vehicle.plate} ({vehicle.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="submit"
                disabled={!selectedClientId || !selectedVehicleId || submitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Iniciar Checklist
                  </>
                )}
              </Button>
            </form>
            
            {clients.length === 0 && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm text-center">
                Nenhum cliente cadastrado. Peça ao administrador para cadastrar clientes e veículos.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}