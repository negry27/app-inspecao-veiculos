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
        .select('*, client:client_id(*), vehicle:vehicle_id(*)')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;
      if (!serviceData) {
        toast.error('Serviço não encontrado.');
        router.push('/employee');
        return;
      }
      
      setService(serviceData as Service);
      setClient(serviceData.client as Client);
      setVehicle(serviceData.vehicle as Vehicle);
      setObservations(serviceData.observations || '');
      setChecklistData(serviceData.checklist_data || {});
      setKmCurrent(serviceData.vehicle?.km_current || '');

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

      setSections(sectionsData as ChecklistSection[] || []);
      setItems(itemsData as ChecklistItem[] || []);

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
    if (!kmCurrent || isNaN(Number(kmCurrent))) {
        toast.error('Por favor, insira o KM atual do veículo.');
        return;
    }

    // Validação: Garantir que todos os itens de 'options' foram respondidos
    let allAnswered = true;
    const totalItems = items.length;
    let answeredCount = 0;

    sections.forEach(section => {
      const sectionItems = items.filter(item => item.section_id === section.id);
      sectionItems.forEach(item => {
        const answer = checklistData[section.id]?.[item.id];
        
        if (item.response_type === 'options' && !answer) {
          allAnswered = false;
        }
        
        // Para 'text' e 'datetime', consideramos respondido se houver algum valor
        if (answer) {
          answeredCount++;
        }
      });
    });

    if (!allAnswered) {
      toast.warning(`Alguns itens de múltipla escolha não foram respondidos.`);
      // Permitir salvar rascunho, mas avisar
    }

    setSubmitting(true);

    try {
      // 1. Atualizar o KM atual do veículo
      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({ km_current: Number(kmCurrent), updated_at: new Date().toISOString() })
        .eq('id', service?.vehicle_id);

      if (vehicleUpdateError) throw vehicleUpdateError;

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
            
            <div className="space-y-2">
                <Label htmlFor="km-current" className="text-gray-300 flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    KM Atual
                </Label>
                <Input
                    id="km-current"
                    type="number"
                    placeholder="Insira o KM atual"
                    value={kmCurrent}
                    onChange={(e) => setKmCurrent(e.target.value)}
                    required
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                />
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
                        {currentAnswer && item.response_type === 'text' && (
                          <div className="text-xs text-gray-400 truncate max-w-[50%]">
                            {currentAnswer}
                          </div>
                        )}
                        {currentAnswer && item.response_type === 'datetime' && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {new Date(currentAnswer).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </Label>
                      
                      {item.response_type === 'options' ? (
                        <RadioGroup 
                          value={currentAnswer}
                          onValueChange={(value) => handleAnswerChange(section.id, item.id, value)}
                          className="flex flex-wrap gap-4"
                        >
                          {item.options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={option} 
                                id={`${item.id}-${option}`} 
                                className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <Label htmlFor={`${item.id}-${option}`} className="text-sm text-gray-400 cursor-pointer">
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
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                        />
                      ) : (
                        <Input
                          type="text"
                          placeholder="Insira a observação ou valor..."
                          value={currentAnswer}
                          onChange={(e) => handleAnswerChange(section.id, item.id, e.target.value)}
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                        />
                      )}
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