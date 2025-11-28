'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, ClipboardList, CheckCircle, XCircle, AlertTriangle, User, Car, Gauge, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase, Service, ChecklistSection, ChecklistItem, Client, Vehicle } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';

interface ChecklistData {
  [sectionId: string]: {
    [itemId: string]: string; // value of the selected option or text input
  };
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
  const [service, setService] = useState<Service | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checklistData, setChecklistData] = useState<ChecklistData>({});
  const [observations, setObservations] = useState('');
  
  // Estado para armazenar o KM atual do veículo (usado para atualização no DB)
  const [kmCurrent, setKmCurrent] = useState<number | string>('');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'employee') {
      router.push('/login');
      return;
    }
    if (serviceId) {
      loadServiceData();
    }
  }, [router, serviceId]);

  const loadServiceData = async () => {
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
      
      const loadedService = serviceData as Service & { client: Client, vehicle: Vehicle, employee: any };
      
      setService(loadedService);
      setClient(loadedService.client);
      setVehicle(loadedService.vehicle);
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

      loadedSections.forEach(section => {
        loadedItems.filter(item => item.section_id === section.id).forEach(item => {
          let autoValue = initialChecklistData[section.id]?.[item.id];

          if (item.response_type === 'autofill' && !autoValue) {
            const itemTitleLower = item.title.toLowerCase();
            
            if (itemTitleLower.includes('tipo') && loadedService.vehicle?.type) {
              autoValue = loadedService.vehicle.type;
            } else if (itemTitleLower.includes('modelo') && loadedService.vehicle?.model) {
              autoValue = loadedService.vehicle.model;
            } else if (itemTitleLower.includes('placa') && loadedService.vehicle?.plate) {
              autoValue = loadedService.vehicle.plate;
            } else if (itemTitleLower.includes('km atual') && loadedService.vehicle?.km_current !== undefined) {
              autoValue = String(loadedService.vehicle.km_current);
            } else if (itemTitleLower.includes('cliente') && loadedService.client?.name) {
              autoValue = loadedService.client.name;
            } else if (itemTitleLower.includes('funcionário') && loadedService.employee?.username) {
              autoValue = loadedService.employee.username;
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
    let kmItemAnswer: string | undefined;
    let allOptionsAnswered = true;

    sections.forEach(section => {
      const sectionItems = items.filter(item => item.section_id === section.id);
      sectionItems.forEach(item => {
        const answer = checklistData[section.id]?.[item.id];
        
        const itemTitleLower = item.title.toLowerCase();

        // 1. Capturar KM Atual
        if (itemTitleLower.includes('km atual') || itemTitleLower.includes('quilometragem')) {
            kmItemAnswer = answer;
        }

        // 2. Validar se todas as opções foram respondidas
        if (item.response_type === 'options' && !answer) {
          allOptionsAnswered = false;
        }
      });
    });
    
    // Validação do KM (se houver um campo de KM no checklist)
    if (kmItemAnswer && (isNaN(Number(kmItemAnswer)) || Number(kmItemAnswer) <= 0)) {
        toast.error('Por favor, insira um valor válido para o KM atual no checklist.');
        return;
    }

    if (!allOptionsAnswered) {
      toast.warning(`Alguns itens de múltipla escolha não foram respondidos.`);
    }

    setSubmitting(true);

    try {
      // 1. Atualizar o KM atual do veículo APENAS se o valor foi preenchido no checklist
      if (kmItemAnswer && service?.vehicle_id) {
        const { error: vehicleUpdateError } = await supabase
          .from('vehicles')
          .update({ km_current: Number(kmItemAnswer), updated_at: new Date().toISOString() })
          .eq('id', service.vehicle_id);

        if (vehicleUpdateError) throw vehicleUpdateError;
      }

      // 2. Atualizar o serviço
      const { error: serviceUpdateError } = await supabase
        .from('services')
        .update({
          checklist_data: checklistData,
          observations: observations,
          updated_at: new Date().toISOString(),
        })
        .eq('id', serviceId);

      if (serviceUpdateError) throw serviceUpdateError;

      toast.success('Inspeção finalizada e salva com sucesso!');
      router.push('/employee'); // Redirecionar após salvar

    } catch (error: any) {
      console.error('Erro ao salvar checklist:', error);
      toast.error(error.message || 'Erro ao salvar checklist.');
    } finally {
      setSubmitting(false);
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
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Checklist Não Configurado</h2>
            <p className="text-gray-400 mt-2">O administrador ainda não configurou as seções e itens do checklist. Por favor, entre em contato com o administrador.</p>
          </Card>
        </div>
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
                    <p className="text-gray-400">Veículo: <span className="text-white font-medium">{vehicle?.model} ({vehicle?.plate})</span></p>
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
                  
                  // KM Atual é um campo de texto/número que é preenchido automaticamente, mas pode ser editado
                  const isKmField = itemTitleLower.includes('km atual') || itemTitleLower.includes('quilometragem');
                  
                  const isDisabled = isAutofillField && !isKmField;

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
                            {new Date(currentAnswer).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
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
                          type={isKmField ? 'number' : 'text'}
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
                Salvando...
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