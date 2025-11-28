'use client';

import { useState, useEffect } from 'react';
import { supabase, Service, Client, Vehicle, User, ChecklistSection, ChecklistItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { generateAndUploadPDF } from '@/lib/pdf-utils';
import { useRouter } from 'next/navigation';

// Tipo auxiliar para o serviço com dados de relacionamento
interface ServiceWithDetails extends Service {
  client: Client;
  vehicle: Vehicle;
  employee: User;
}

export default function ServicesTab() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    employee_id: '',
    observations: '',
    photos: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Buscar serviços com dados aninhados
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          client:client_id(*),
          vehicle:vehicle_id(*),
          employee:employee_id(*)
        `)
        .order('created_at', { ascending: false });

      // Buscar listas para o formulário
      const [clientsData, vehiclesData, employeesData] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('users').select('*').eq('role', 'employee')
      ]);

      if (servicesError) throw servicesError;
      if (clientsData.error) throw clientsData.error;
      if (vehiclesData.error) throw vehiclesData.error;
      if (employeesData.error) throw employeesData.error;

      // O Supabase retorna relacionamentos aninhados como objetos, mas a tipagem pode ser complexa.
      // Assumimos que a query acima retorna os objetos diretamente.
      setServices(servicesData as ServiceWithDetails[] || []);
      setClients(clientsData.data || []);
      setVehicles(vehiclesData.data || []);
      setEmployees(employeesData.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('services')
        .insert([{
          ...formData,
          checklist_data: {}, // Inicialmente vazio
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      toast.success('Serviço criado com sucesso!');
      setDialogOpen(false);
      setFormData({ client_id: '', vehicle_id: '', employee_id: '', observations: '', photos: [] });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar serviço');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      toast.success('Serviço excluído com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir serviço');
    }
  };

  const handleGeneratePDF = async (service: ServiceWithDetails) => {
    if (service.pdf_url) {
      // Se o PDF já existe, apenas abre a URL
      window.open(service.pdf_url, '_blank');
      return;
    }
    
    setPdfLoadingId(service.id);

    try {
      // 1. Buscar dados completos do checklist e itens
      const [sectionsRes, itemsRes] = await Promise.all([
        supabase.from('checklist_sections').select('*').order('order', { ascending: true }),
        supabase.from('checklist_items').select('*').order('order', { ascending: true })
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const details = {
        service: service,
        client: service.client,
        vehicle: service.vehicle,
        employee: service.employee,
        sections: sectionsRes.data as ChecklistSection[],
        items: itemsRes.data as ChecklistItem[],
      };

      // 2. Gerar e fazer upload do PDF
      const pdfResult = await generateAndUploadPDF(details);
      
      if (!pdfResult.success || !pdfResult.pdfUrl) {
        throw new Error(pdfResult.error || 'Falha ao gerar PDF.');
      }
      
      toast.success('PDF gerado e salvo com sucesso!');
      
      // 3. Recarregar dados para atualizar a URL do PDF na lista
      loadData(); 
      
      // 4. Abrir o PDF recém-gerado
      window.open(pdfResult.pdfUrl, '_blank');

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Verifique se o checklist foi preenchido.');
    } finally {
      setPdfLoadingId(null);
    }
  };
  
  const handleEdit = (serviceId: string) => {
    router.push(`/admin/service/${serviceId}/checklist`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gerenciar Serviços</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
              <DialogTitle>Novo Serviço</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a]">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Veículo</Label>
                <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a]">
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} - {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a]">
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Criar Serviço
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>Serviço #{service.id.substring(0, 8)}...</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(service.id)}
                    className="bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGeneratePDF(service)}
                    disabled={pdfLoadingId === service.id}
                    className="bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20"
                  >
                    {pdfLoadingId === service.id ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Download className="w-3 h-3 mr-1" />
                    )}
                    {service.pdf_url ? 'Ver PDF' : 'Gerar PDF'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(service.id)}
                    className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Cliente</p>
                  <p className="text-white">{service.client?.name || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Veículo</p>
                  <p className="text-white">{service.vehicle?.model || 'Não informado'} - {service.vehicle?.plate || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Funcionário</p>
                  <p className="text-white">{service.employee?.username || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Data</p>
                  <p className="text-white">{new Date(service.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              {service.observations && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Observações</p>
                  <p className="text-white text-sm">{service.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum serviço cadastrado
        </div>
      )}
    </div>
  );
}