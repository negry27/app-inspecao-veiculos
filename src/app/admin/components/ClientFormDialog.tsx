'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth';
import { formatPhoneNumber } from '@/lib/utils';

interface ClientFormDialogProps {
  client?: any; // Optional for editing
  onSave: () => void;
}

export default function ClientFormDialog({ client, onSave }: ClientFormDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      // Formata o telefone para exibição no input
      const formattedPhone = client.phone ? formatPhoneNumber(client.phone) : '';
      setFormData({ name: client.name, phone: formattedPhone });
    } else {
      setFormData({ name: '', phone: '' });
    }
  }, [client]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formattedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
        toast.error('O nome do cliente é obrigatório.');
        return;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
        toast.error('Sessão expirada ou usuário não autenticado.');
        return;
    }

    setSaving(true);

    try {
      // Limpar o telefone: remove a máscara antes de salvar no banco
      const rawPhone = formData.phone.replace(/\D/g, '').trim();
      
      const clientData = {
        name: formData.name.trim(),
        phone: rawPhone || null, // Salva apenas números ou null
        user_id: currentUser.id, // Adicionando o user_id para satisfazer o RLS
      };

      if (client) {
        // Update
        const updateData = {
            name: formData.name.trim(),
            phone: rawPhone || null,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', client.id);

        if (error) throw error;
        toast.success('Cliente atualizado!');
      } else {
        // Create
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;
        toast.success('Cliente criado!');
      }

      setDialogOpen(false);
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error.message || 'Erro ao salvar cliente. Verifique se você está logado.');
    } finally {
      setSaving(false);
    }
  };

  const triggerButton = client ? (
    <Button
      size="sm"
      variant="outline"
      className="bg-blue-500/10 border-blue-500/20 text-blue-500"
    >
      <Edit className="w-3 h-3" />
    </Button>
  ) : (
    <Button className="bg-blue-600 hover:bg-blue-700">
      <Plus className="w-4 h-4 mr-2" />
      Novo Cliente
    </Button>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar' : 'Novo'} Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={saving}
              className="bg-[#0a0a0a] border-[#2a2a2a]"
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone (Opcional)</Label>
            <Input
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(xx) x xxxx-xxxx"
              maxLength={16}
              disabled={saving}
              className="bg-[#0a0a0a] border-[#2a2a2a]"
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (client ? 'Atualizar' : 'Criar') + ' Cliente'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}