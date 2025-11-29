'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, Loader2, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ServiceRecord {
    id: string;
    created_at: string;
    pdf_url: string | null;
    // Ajustado para refletir a estrutura de array retornada pelo Supabase para relacionamentos aninhados
    client: { name: string }[]; 
    vehicle: { model: string, plate: string }[];
}

export default function ServiceHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'employee') {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadServices(user.id);
  }, [router]);

  const loadServices = async (employeeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, created_at, pdf_url, client:client_id(name), vehicle:vehicle_id(model, plate)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setServices(data as ServiceRecord[] || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de serviços.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadPDF = (url: string | null) => {
    if (url) {
      // Abre a URL do PDF em uma nova aba
      window.open(url, '_blank');
    } else {
      toast.error('URL do PDF não disponível. O PDF pode estar pendente de geração.');
    }
  };

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
        <h1 className="text-2xl font-bold text-white hidden sm:block">Histórico de Serviços</h1>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5 text-green-500" />
              Meus Serviços Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                Nenhum serviço concluído ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => {
                  // Acessando o primeiro elemento do array de relacionamento
                  const clientName = service.client?.[0]?.name || 'N/A';
                  const vehicleModel = service.vehicle?.[0]?.model || 'N/A';
                  const vehiclePlate = service.vehicle?.[0]?.plate || 'N/A';
                  const pdfAvailable = !!service.pdf_url;

                  return (
                    <div key={service.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a]">
                      <div className="space-y-1 mb-3 sm:mb-0">
                        <p className="text-sm font-medium text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          Serviço ID: <span className="text-blue-400 truncate max-w-[150px] sm:max-w-none">{service.id.substring(0, 8)}...</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          Cliente: {clientName} | Veículo: {vehicleModel} ({vehiclePlate})
                        </p>
                        <p className="text-xs text-gray-500">
                          Data: {format(new Date(service.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleDownloadPDF(service.pdf_url)}
                        disabled={!pdfAvailable}
                        className={`h-8 text-xs ${pdfAvailable ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {pdfAvailable ? 'Baixar PDF' : 'PDF Pendente'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}