'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Car as CarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Função de formatação de telefone
const formatPhoneNumber = (value: string) => {
  // 1. Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, '');

  // 2. Aplica a máscara (xx) x xxxx-xxxx (11 dígitos)
  if (numericValue.length > 11) {
    return numericValue.substring(0, 11).replace(
      /^(\d{2})(\d{1})(\d{4})(\d{4})$/,
      '($1) $2 $3-$4'
    );
  }
  
  // Aplica a máscara (xx) x xxxx-xxxx (11 dígitos)
  if (numericValue.length === 11) {
    return numericValue.replace(
      /^(\d{2})(\d{1})(\d{4})(\d{4})$/,
      '($1) $2 $3-$4'
    );
  }
  
  // Aplica a máscara (xx) xxxx-xxxx (10 dígitos)
  if (numericValue.length === 10) {
    return numericValue.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }
  
  // Aplica a máscara parcial
  if (numericValue.length > 2) {
    return `(${numericValue.substring(0, 2)}) ${numericValue.substring(2)}`;
  }
  
  if (numericValue.length > 0) {
    return `(${numericValue}`;
  }

  return numericValue;
};

// Função de formatação de placa (XXX-XXXX)
const formatPlate = (value: string) => {
  // Remove caracteres não alfanuméricos e converte para maiúsculas
  const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Limita a 7 caracteres (3 letras/números + 4 números/letras)
  const numericValue = cleanValue.substring(0, 7);
  
  if (numericValue.length > 3) {
    // Aplica o hífen após o terceiro caractere
    return numericValue.replace(
      /^([a-zA-Z0-9]{3})([a-zA-Z0-9]*)$/,
      '$1-$2'
    );
  }
  
  return numericValue;
};


export default function ClientsTab() {
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  const [clientForm, setClientForm] = useState({ name: '', phone: '' });
  const [vehicleForm, setVehicleForm] = useState({
    type: 'car' as 'car' | 'motorcycle' | 'van',
    model: '', // Separado de model_year
    year: '', // Separado de model_year
    plate: '',
    driver_name: '', 
    observations: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');

      if (vehiclesError) throw vehiclesError;

      setClients(clientsData || []);
      setVehicles(vehiclesData || []);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Garantir que o nome não está vazio
    if (!clientForm.name.trim()) {
        toast.error('O nome do cliente é obrigatório.');
        return;
    }

    try {
      // Limpar o telefone: remove a máscara antes de salvar no banco
      const rawPhone = clientForm.phone.replace(/\D/g, '').trim();
      
      const clientData = {
        name: clientForm.name.trim(),
        phone: rawPhone || null, // Salva apenas números ou null
      };

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({ ...clientData, updated_at: new Date().toISOString() })
          .eq('id', editingClient.id);

        if (error) throw error;
        toast.success('Cliente atualizado!');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;
        toast.success('Cliente criado!');
      }

      setDialogOpen(false);
      setEditingClient(null);
      setClientForm({ name: '', phone: '' });
      loadClients();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar cliente');
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setClientForm({ ...clientForm, phone: formattedValue });
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPlate(e.target.value);
    setVehicleForm({ ...vehicleForm, plate: formattedValue });
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const modelYearCombined = `${vehicleForm.model.trim()}/${vehicleForm.year.trim()}`;
    const rawPlate = vehicleForm.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (!vehicleForm.model || !vehicleForm.year || !rawPlate) {
        toast.error('Modelo, Ano e Placa são obrigatórios.');
        return;
    }
    
    if (rawPlate.length < 7) {
        toast.error('A placa deve ter 7 caracteres (ex: ABC1234).');
        return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([{ 
            client_id: selectedClientId,
            type: vehicleForm.type,
            model_year: modelYearCombined, // Combinando Modelo/Ano
            plate: rawPlate, // Salvando sem máscara
            driver_name: vehicleForm.driver_name || null,
            observations: vehicleForm.observations || null,
        }]);

      if (error) throw error;
      toast.success('Veículo adicionado!');
      setVehicleDialogOpen(false);
      setVehicleForm({ type: 'car', model: '', year: '', plate: '', driver_name: '', observations: '' });
      loadClients();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar veículo');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza? Isso excluirá todos os veículos associados.')) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cliente excluído!');
      loadClients();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Veículo excluído!');
      loadClients();
    } catch (error) {
      toast.error('Erro ao excluir veículo');
    }
  };

  // Função para formatar o telefone ao carregar o formulário de edição
  const openEditDialog = (client: any) => {
    const formattedPhone = client.phone ? formatPhoneNumber(client.phone) : '';
    setEditingClient(client);
    setClientForm({ name: client.name, phone: formattedPhone });
    setDialogOpen(true);
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
        <h2 className="text-2xl font-bold text-white">Gerenciar Clientes</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingClient(null);
              setClientForm({ name: '', phone: '' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar' : 'Novo'} Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleClientSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  required
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone (Opcional)</Label>
                <Input
                  value={clientForm.phone}
                  onChange={handlePhoneChange}
                  placeholder="(xx) x xxxx-xxxx"
                  maxLength={16} // (99) 9 9999-9999 tem 16 caracteres
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                {editingClient ? 'Atualizar' : 'Criar'} Cliente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => {
          const clientVehicles = vehicles.filter(v => v.client_id === client.id);
          
          return (
            <Card key={client.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{client.name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(client)}
                      className="bg-blue-500/10 border-blue-500/20 text-blue-500"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClient(client.id)}
                      className="bg-red-500/10 border-red-500/20 text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-400">Telefone: {client.phone ? formatPhoneNumber(client.phone) : 'N/A'}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Veículos</h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setVehicleDialogOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {clientVehicles.length > 0 ? (
                    <div className="space-y-2">
                      {clientVehicles.map((vehicle) => (
                        <div key={vehicle.id} className="flex items-center justify-between bg-[#0a0a0a] p-2 rounded border border-[#2a2a2a]">
                          <div className="flex items-center gap-2">
                            <CarIcon className="w-4 h-4 text-blue-500" />
                            <div className="text-xs">
                              <p className="text-white font-medium">{vehicle.model_year} ({vehicle.type})</p>
                              <p className="text-gray-400">{vehicle.plate} - Motorista: {vehicle.driver_name || 'N/A'}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Nenhum veículo cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vehicle Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>Adicionar Veículo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVehicleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={vehicleForm.type} onValueChange={(value: any) => setVehicleForm({ ...vehicleForm, type: value })}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="car" className="text-white">Carro</SelectItem>
                  <SelectItem value="motorcycle" className="text-white">Moto</SelectItem>
                  <SelectItem value="van" className="text-white">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                        value={vehicleForm.model}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                        required
                        className="bg-[#0a0a0a] border-[#2a2a2a]"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Ano</Label>
                    <Input
                        value={vehicleForm.year}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                        required
                        type="number"
                        maxLength={4}
                        className="bg-[#0a0a0a] border-[#2a2a2a]"
                    />
                </div>
            </div>
            
            <div className="space-y-2">
              <Label>Placa (XXX-XXXX)</Label>
              <Input
                value={vehicleForm.plate}
                onChange={handlePlateChange} // Usando a função de formatação aqui
                required
                maxLength={8} // 3 letras + hífen + 4 números/letras
                placeholder="ABC-1234"
                className="bg-[#0a0a0a] border-[#2a2a2a]"
              />
            </div>
            <div className="space-y-2">
              <Label>Motorista (Opcional)</Label>
              <Input
                value={vehicleForm.driver_name}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a]"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações (Opcional)</Label>
              <Textarea
                value={vehicleForm.observations}
                onChange={(e) => setVehicleForm({ ...vehicleForm, observations: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a]"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Adicionar Veículo
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {clients.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum cliente cadastrado
        </div>
      )}
    </div>
  );
}