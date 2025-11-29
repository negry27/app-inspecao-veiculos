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
import { Plus, Trash2, Download, Loader2, Edit, User as UserIcon, Car, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { generateAndUploadPDF } from '@/lib/pdf-utils';
import { useRouter } from 'next/navigation';

// Tipo auxiliar para o serviço com dados de relacionamento (ajustado para arrays)
interface ServiceWithDetails extends Service {
  client: Client[];
  vehicle: Vehicle[];
  employee: User[];
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
          client:client_id(name, phone),
          vehicle:vehicle_id(model, plate, type, km_current, observations),
          employee:employee_id(username, cargo)
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

      // O Supabase retorna relacionamentos aninhados como arrays.
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
    
    if (!formData.client_id || !formData.vehicle_id || !formData.employee_id) {
        toast.error('Por favor, selecione Cliente, Veículo e Funcionário.');
        return;
    }

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

  const handleDownloadExistingPDF = async (service: ServiceWithDetails) => {
    const vehicleDetail = service.vehicle?.[0];
    const url = service.pdf_url;

    if (!url) {
        toast.error('PDF não disponível.');
        return;
    }

    setPdfLoadingId(service.id);
    try {
        // Extrai o caminho do arquivo do URL público
        const urlParts = url.split('/public/pdf-reports/');
        if (urlParts.length < 2) {
            throw new Error('URL do PDF inválida.');
        }
        const filePath = urlParts[1];
        
        // Usa a função download do Supabase Storage para forçar o download
        const { data, error } = await supabase.storage
          .from('pdf-reports')
          .download(filePath);

        if (error) throw error;

        if (data) {
          const blobUrl = window.URL.createObjectURL(data);
          const link = document.createElement('a');
          link.href = blobUrl;
          // Define o nome do arquivo para download
          link.setAttribute('download', `${service.id.substring(0, 8)}-${vehicleDetail?.plate || 'report'}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
          toast.success('Download iniciado!');
        } else {
          throw new Error('Nenhum dado de arquivo retornado.');
        }

    } catch (error) {
        console.error('Erro ao baixar PDF:', error);
        toast.error('Erro ao baixar PDF. Tente gerar novamente.');
    } finally {
        setPdfLoadingId(null);
    }
  };

  const handleGeneratePDF = async (service: ServiceWithDetails) => {
    // Acessa o primeiro elemento do array de relacionamento
    const clientDetail = service.client?.[0];
    const vehicleDetail = service.vehicle?.[0];
    const employeeDetail = service.employee?.[0];

    // Prioriza dados embutidos (para novos serviços)
    const embeddedClient = service.checklist_data?.__meta?.client_details;
    const embeddedVehicle = service.checklist_data?.__meta?.vehicle_details;
    const embeddedEmployee = service.checklist_data?.__meta?.employee_details;
    
    const finalClient = embeddedClient || clientDetail;
    const finalVehicle = embeddedVehicle || vehicleDetail;
    const finalEmployee = embeddedEmployee || employeeDetail;

    if (!finalClient || !finalVehicle || !finalEmployee) {
        toast.error('Dados de cliente/veículo/funcionário incompletos para gerar PDF. Edite o serviço e preencha o checklist.');
        return;
    }

    if (service.pdf_url) {
      // Se o PDF já existe, apenas chama a função de download
      await handleDownloadExistingPDF(service);
      return;
    }
    
    // Se o PDF não existe, gera e faz upload
    setPdfLoadingId(service.id);

    try {
      // 1. Buscar dados completos do checklist e itens
      const [sectionsRes, itemsRes] = await Promise.all([
        supabase.from('checklist_sections').select('*').order('order', { ascending: true }),
        supabase.from('checklist_items').select('*').order('order', { ascending: true })
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      // Cria um objeto Client e Vehicle tipado a partir dos dados finais
      const clientForPdf: Client = {
        id: service.client_id,
        name: finalClient.name,
        phone: finalClient.phone,
        created_at: '', // Placeholder
        updated_at: '', // Placeholder
      };
      
      const vehicleForPdf: Vehicle = {
        id: service.vehicle_id,
        client_id: service.client_id,
        type: finalVehicle.type,
        model: finalVehicle.model,
        plate: finalVehicle.plate,
        km_current: finalVehicle.km_current,
        observations: finalVehicle.observations,
        created_at: '', // Placeholder
        updated_at: '', // Placeholder
      };
      
      const employeeForPdf: User = {
        id: service.employee_id,
        username: finalEmployee.username,
        cargo: finalEmployee.cargo,
        email: '', // Placeholder
        role: 'employee', // Placeholder
        status: 'active', // Placeholder
        is_temporary_password: false, // Placeholder
        created_at: '', // Placeholder
        updated_at: '', // Placeholder
      };


      const details = {
        service: service,
        client: clientForPdf,
        vehicle: vehicleForPdf,
        employee: employeeForPdf,
        sections: sectionsRes.data as ChecklistSection[],
        items: itemsRes.data as ChecklistItem[],
      };

      // 2. Gerar e fazer upload do PDF
      const pdfResult = await generateAndUploadPDF(details);
      
      if (!pdfResult.success || !pdfResult.pdfUrl) {
        throw new Error(pdfResult.error || 'Falha ao gerar PDF.');
      }
      
      toast.success('PDF gerado e salvo com sucesso! Iniciando download...');
      
      // 3. Recarregar dados para atualizar a URL do PDF na lista
      await loadData(); 
      
      // 4. Tenta forçar o download do PDF recém-gerado
      // Busca o serviço atualizado para garantir que a URL do PDF esteja presente
      const { data: updatedServiceData } = await supabase
        .from('services')
        .select(`*, client:client_id(name, phone), vehicle:vehicle_id(model, plate, type, km_current, observations), employee:employee_id(username, cargo)`)
        .eq('id', service.id)
        .single();

      if (updatedServiceData && updatedServiceData.pdf_url) {
          await handleDownloadExistingPDF(updatedServiceData as ServiceWithDetails);
      }

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
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  required // Adicionado required
                >
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
                <Select 
                  value={formData.vehicle_id} 
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                  required // Adicionado required
                >
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
                <Select 
                  value={formData.employee_id} 
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                  required // Adicionado required
                >
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
        {services.map((service) => {
          // Prioriza dados embutidos (para novos serviços)
          const embeddedClient = service.checklist_data?.__meta?.client_details;
          const embeddedVehicle = service.checklist_data?.__meta?.vehicle_details;
          const embeddedEmployee = service.checklist_data?.__meta?.employee_details;
          
          // Fallback para dados de relacionamento (para serviços antigos)
          const clientDetail = embeddedClient || service.client?.[0];
          const vehicleDetail = embeddedVehicle || service.vehicle?.[0];
          const employeeDetail = embeddedEmployee || service.employee?.[0];
          const pdfAvailable = !!service.pdf_url;

          return (
            <Card key={service.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-500" />
                    Serviço ID: <span className="text-blue-400 text-base font-normal">{service.id.substring(0, 8)}...</span>
                  </div>
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
                      {pdfAvailable ? 'Baixar PDF' : 'Gerar PDF'}
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
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm border-t border-[#2a2a2a] pt-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-400">Cliente</p>
                      <p className="text-white font-medium">{clientDetail?.name || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-400">Veículo</p>
                      <p className="text-white font-medium">{vehicleDetail?.model || 'N/A'} ({vehicleDetail?.plate || 'N/A'})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-400">Funcionário</p>
                      <p className="text-white font-medium">{employeeDetail?.username || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 border-t border-[#2a2a2a] pt-3 mt-3">
                    Criado em: {new Date(service.created_at).toLocaleDateString('pt-BR')} às {new Date(service.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {service.observations && (
                  <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                    <p className="text-gray-400 text-sm mb-1">Observações</p>
                    <p className="text-white text-sm">{service.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum serviço cadastrado
        </div>
      )}
    </div>
  );
}