'use client';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Car as CarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatPlateDisplay, formatPhoneNumber } from '@/lib/utils';
import ClientFormDialog from './ClientFormDialog';
import VehicleFormDialog from './VehicleFormDialog';

interface ClientCardProps {
  client: any;
  vehicles: any[];
  onUpdate: () => void;
}

export default function ClientCard({ client, vehicles, onUpdate }: ClientCardProps) {

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza? Isso excluirá o cliente e todos os veículos associados.')) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cliente excluído!');
      onUpdate();
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
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir veículo');
    }
  };

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>{client.name}</span>
          <div className="flex gap-2">
            <ClientFormDialog client={client} onSave={onUpdate} />
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
            <VehicleFormDialog clientId={client.id} onSave={onUpdate} />
          </div>
          
          {vehicles.length > 0 ? (
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between bg-[#0a0a0a] p-2 rounded border border-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <CarIcon className="w-4 h-4 text-blue-500" />
                    <div className="text-xs">
                      <p className="text-white font-medium">{vehicle.model_year} ({vehicle.type})</p>
                      <p className="text-gray-400">{formatPlateDisplay(vehicle.plate)} - Motorista: {vehicle.driver_name || 'N/A'}</p>
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
}