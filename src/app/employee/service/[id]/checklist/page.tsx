'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, ClipboardList, CheckCircle, XCircle, AlertTriangle, User, Car, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase, Service, ChecklistSection, ChecklistItem, Client, Vehicle, User as DBUser } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';
import { generateAndUploadPDF } from '@/lib/pdf-utils'; // Importando a nova função
import { format } from 'date-fns';

interface ChecklistData {
  [sectionId: string]: {
    [itemId: string]: string; // value of the selected option or text input
  };
}

// Define a interface para incluir os dados de relacionamento
interface ServiceWithDetails extends Service {
  client: Client;
  vehicle: Vehicle;
  employee: DBUser; // Usando DBUser para tipagem correta
}

// Função auxiliar para formatar data/hora para input datetime-local
const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function ServiceChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState<ServiceWithDetails | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<DBUser | null>(null); // Detalhes completos do funcionário
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checklistData, setChecklistData] = useState<ChecklistData>({});
  const [observations, setObservations] = useState('');
  
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'employee') {
      router.push('/login');
      return;
    }
    
    if (serviceId) {
      loadServiceData(currentUser.id);
    }
  }, [router, serviceId]);

  const loadServiceData = async (currentUserId: string) => {
    try {
      // 1. Carregar Serviço e relacionamentos
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*, client:client_id(*), vehicle:vehicle_id(*), employee:employee_id(*)')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;
      if (!serviceData) {
        toast.error('Serviço não encontrado.');
        router.push('/employee');
        return;
      }
      
      const loadedService = serviceData as ServiceWithDetails;
      
      // ⚠️ Segurança: Garantir que o funcionário logado é o dono do serviço
      if (loadedService.employee_id !== currentUserId) {
        toast.error('Acesso negado. Este serviço não pertence a você.');
        router.push('/employee');
        return;
      }
      
      setService(loadedService);
      setClient(loadedService.client);
      setVehicle(loadedService.vehicle);
      setEmployeeDetails(loadedService.employee); // Usar detalhes completos do funcionário
      setObservations(loadedService.observations || '');
      
      const initialChecklistData = loadedService.checklist_data || {};
      
      // 2. Carregar Checklist (Seções e Itens)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('checklist_sections')
        .select('*')
        .order('order', { ascending: true });

      if (sectionsError) throw sectionsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .order('order', { ascending: true });

      if (itemsError) throw itemsError;

      const loadedSections = sectionsData as ChecklistSection[] || [];
      const loadedItems = itemsData as ChecklistItem[] || [];
      
      // 3. Preenchimento Automático de Dados
      const autoFilledData: ChecklistData = {};
      const now = formatDateTimeLocal(new Date());
      
      // Priorizar dados embutidos no __meta
      const embeddedClient = loadedService.checklist_data?.__meta?.client_details;
      const embeddedVehicle = loadedService.checklist_data?.__meta?.vehicle_details;
      const embeddedEmployee = loadedService.checklist_data?.__meta?.employee_details;

      // Usar dados embutidos se existirem, caso contrário, usar dados de relacionamento
      const finalClient = embeddedClient || loadedService.client;
      const finalVehicle = embeddedVehicle || loadedService.vehicle;
      const finalEmployee = embeddedEmployee || loadedService.employee;


      loadedSections.forEach(section => {
        loadedItems.filter(item => item.section_id === section.id).forEach(item => {
          let autoValue = initialChecklistData[section.id]?.[item.id];

          if (item.response_type === 'autofill' && !autoValue) {
            const itemTitleLower = item.title.toLowerCase();
            
            if (itemTitleLower.includes('tipo') && finalVehicle?.type) {
              autoValue = finalVehicle.type;
            } else if (itemTitleLower.includes('modelo') && finalVehicle?.model_year) {
              autoValue = finalVehicle.model_year;
            } else if (itemTitleLower.includes('placa') && finalVehicle?.plate) {
              autoValue = finalVehicle.plate;
            } else if (itemTitleLower.includes('motorista') && finalVehicle?.driver_name) {
              autoValue = finalVehicle.driver_name;
            } else if (itemTitleLower.includes('cliente') && finalClient?.name) {
              autoValue = finalClient.name;
            } else if (itemTitleLower.includes('funcionário') && finalEmployee?.username) {
              autoValue = finalEmployee.username;
            }
          } else if (item.response_type === 'datetime' && item.title.toLowerCase().includes('data e hora da inspeção') && !autoValue) {
            // Preenche automaticamente com a hora de início da inspeção
            autoValue = now;
          }
          
          if (autoValue !== undefined) {
            autoFilledData[section.id] = {
              ...(autoFilledData[section.id] || {}),
              [item.id]: autoValue,
            };
          }
        });
      });
      
      setChecklistData({ ...initialChecklistData, ...autoFilledData });
      setSections(loadedSections);
      setItems(loadedItems);

    } catch (error) {
      console.error('Erro ao carregar dados do serviço:', error);
      toast.error('Erro ao carregar dados do serviço.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (sectionId: string, itemId: string, value: string) => {
    setChecklistData(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [itemId]: value,
      },
    }));
  };

  const getStatusIcon = (value: string) => {
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('ok') || lowerValue.includes('bom') || lowerValue.includes('limpo') || lowerValue.includes('pago') || lowerValue.includes('no veículo')) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (lowerValue.includes('trocar') || lowerValue.includes('vencido') || lowerValue.includes('faltando') || lowerValue.includes('não funciona') || lowerValue.includes('inativo') || lowerValue.includes('danificado') || lowerValue.includes('rasgado')) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const handleSubmitChecklist = async () => {
    if (!service || !client || !vehicle || !employeeDetails) {
        toast.error('Dados do serviço incompletos. Recarregue a página.');
        return;
    }

    // --- START Validation and Data Collection ---
    let allOptionsAnswered = true;
    let totalItems = 0;
    let answeredItems = 0;

    sections.forEach(section => {
      const sectionItems = items.filter(item => item.section_id === section.id);
      sectionItems.forEach(item => {
        totalItems++;
        const answer = checklistData[section.id]?.[item.id];
        
        if (answer) {
            answeredItems++;
        }

        // 1. Validar se todas as opções foram respondidas (apenas para tipo 'options')
        if (item.response_type === 'options' && !answer) {
          allOptionsAnswered = false;
        }
      });
    });
    
    if (totalItems === 0) {
        toast.error('O checklist está vazio. Por favor, configure os itens.');
        return;
    }
    
    if (answeredItems === 0) {
        toast.error('Nenhum item do checklist foi respondido.');
        return;
    }
    
    if (!allOptionsAnswered) {
      toast.warning(`Alguns itens de múltipla escolha não foram respondidos.`);
    }
    // --- END Validation and Data Collection ---

    setSubmitting(true);
    console.log('Iniciando submissão do checklist...');

    try {
      // 1. Atualizar o serviço com checklist e observações
      const updatedServiceData = {
          checklist_data: checklistData,
          observations: observations,
      };
      
      console.log('Atualizando registro de serviço...');
      const { data: updatedService, error: serviceUpdateError } = await supabase
        .from('services')
        .update(updatedServiceData)
        .eq('id', serviceId)
        .select()
        .single();

      if (serviceUpdateError) throw new Error(`Erro ao atualizar serviço: ${serviceUpdateError.message}`);
      
      // 2. Gerar e fazer upload do PDF
      console.log('Iniciando geração e upload do PDF...');
      
      // Priorizar dados embutidos para o PDF
      const finalClient = service.checklist_data?.__meta?.client_details || client;
      const finalVehicle = service.checklist_data?.__meta?.vehicle_details || vehicle;
      const finalEmployee = service.checklist_data?.__meta?.employee_details || employeeDetails;

      const pdfResult = await generateAndUploadPDF({
          service: { ...service, ...updatedServiceData, pdf_url: updatedService.pdf_url },
          client: finalClient,
          vehicle: finalVehicle,
          employee: finalEmployee,
          sections,
          items
      });
      
      if (!pdfResult.success) {
          console.error('Falha na geração do PDF:', pdfResult.error);
          toast.error(`Checklist salvo, mas falha ao gerar PDF: ${pdfResult.error}`);
      } else {
          console.log('PDF gerado e URL salva:', pdfResult.pdfUrl);
          toast.success('Inspeção finalizada, salva e PDF gerado com sucesso!');
      }

      router.push('/employee/history'); // Redirecionar para o histórico

    } catch (error: any) {
      console.error('Erro fatal ao salvar checklist:', error);
      
      let errorMessage = 'Erro desconhecido ao salvar checklist.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Erro ao finalizar: ${errorMessage}`);
    } finally {
      setSubmitting(false);
      console.log('Submissão finalizada.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  if (sections.length === 0) {
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
        </header>
        <main className="max-w-4xl mx-auto space-y-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Checklist Não Configurado</h2>
            <p className="text-gray-400 mt-2">O administrador ainda não configurou as seções e itens do checklist. Por favor, entre em contato com o administrador.</p>
          </Card>
        </main>
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
        <h1 className="text-2xl font-bold text-white hidden sm:block">Checklist de Inspeção</h1>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Informações do Serviço */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Inspeção em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-400">Cliente: <span className="text-white font-medium">{client?.name}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-400">Veículo: <span className="text-white font-medium">{vehicle?.model_year} ({vehicle?.plate})</span></p>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Seções do Checklist */}
        {sections.map((section) => {
          const sectionItems = items.filter(item => item.section_id === section.id);
          
          if (sectionItems.length === 0) return null;

          return (
            <Card key={section.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-white text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sectionItems.map((item) => {
                  const currentAnswer = checklistData[section.id]?.[item.id] || '';
                  const itemTitleLower = item.title.toLowerCase();
                  
                  // Determinar se o campo deve ser desabilitado
                  const isAutofillField = item.response_type === 'autofill';
                  
                  // Nenhum campo é editável se for autofill, pois KM foi removido.
                  const isDisabled = isAutofillField;

                  return (
                    <div key={item.id} className="space-y-2 p-3 border border-[#2a2a2a] rounded-lg">
                      <Label className="text-gray-300 flex items-center justify-between">
                        {item.title}
                        {currentAnswer && item.response_type === 'options' && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {getStatusIcon(currentAnswer)}
                            {currentAnswer}
                          </div>
                        )}
                        {currentAnswer && (item.response_type === 'text' || item.response_type === 'autofill') && (
                          <div className="text-xs text-gray-400 truncate max-w-[50%]">
                            {currentAnswer}
                          </div>
                        )}
                        {currentAnswer && item.response_type === 'datetime' && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {/* Formato DD/MM/YYYY HH:MM */}
                            {new Date(currentAnswer).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                          </div>
                        )}
                      </Label>
                      
                      {item.response_type === 'options' ? (
                        <RadioGroup 
                          value={currentAnswer}
                          onValueChange={(value) => handleAnswerChange(section.id, item.id, value)}
                          className="flex flex-wrap gap-4"
                          disabled={isDisabled}
                        >
                          {item.options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={option} 
                                id={`${item.id}-${option}`} 
                                className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                disabled={isDisabled}
                              />
                              <Label htmlFor={`${item.id}-${option}`} className={`text-sm cursor-pointer ${isDisabled ? 'text-gray-600' : 'text-gray-400'}`}>
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : item.response_type === 'datetime' ? (
                        <Input
                          type="datetime-local"
                          value={currentAnswer}
                          onChange={(e) => handleAnswerChange(section.id, item.id, e.target.value)}
                          required
                          disabled={isDisabled}
                          className={`bg-[#0a0a0a] border-[#2a2a2a] text-white ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      ) : (
                        <Input
                          type={'text'}
                          placeholder={isDisabled ? 'Preenchido automaticamente' : 'Insira a observação ou valor...'}
                          value={currentAnswer}
                          onChange={(e) => handleAnswerChange(section.id, item.id, e.target.value)}
                          disabled={isDisabled}
                          className={`bg-[#0a0a0a] border-[#2a2a2a] text-white ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      )}
                      {isDisabled && <p className="text-xs text-yellow-500 mt-1">Preenchido automaticamente com dados do sistema.</p>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
        
        {/* Observações */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Observações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione quaisquer observações adicionais sobre o serviço ou veículo."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
            />
          </CardContent>
        </Card>

        {/* Botão de Submissão */}
        <div className="pb-8">
          <Button 
            onClick={handleSubmitChecklist}
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Finalizando e Gerando PDF...
              </>
            ) : (
              'Finalizar Inspeção e Salvar'
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}