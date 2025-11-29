'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ClientCard from './ClientCard';
import ClientFormDialog from './ClientFormDialog';

export default function ClientsTab() {
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <ClientFormDialog onSave={loadClients} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => {
          const clientVehicles = vehicles.filter(v => v.client_id === client.id);
          
          return (
            <ClientCard 
              key={client.id} 
              client={client} 
              vehicles={clientVehicles} 
              onUpdate={loadClients} 
            />
          );
        })}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum cliente cadastrado
        </div>
      )}
    </div>
  );
}