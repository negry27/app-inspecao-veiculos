'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface Cargo {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export default function CargosTab() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCargos();
  }, []);

  const loadCargos = async () => {
    try {
      const { data, error } = await supabase
        .from('cargos')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setCargos(data || []);
    } catch (error) {
      toast.error('Erro ao carregar cargos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCargo(null);
    setFormData({ title: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!formData.title) {
      toast.error('O título do cargo é obrigatório');
      setSaving(false);
      return;
    }

    try {
      if (editingCargo) {
        // Atualizar Cargo
        const { error } = await supabase
          .from('cargos')
          .update({ title: formData.title, description: formData.description })
          .eq('id', editingCargo.id);

        if (error) throw error;
        toast.success('Cargo atualizado!');
      } else {
        // Criar Cargo
        const { error } = await supabase
          .from('cargos')
          .insert([formData]);

        if (error) throw error;
        toast.success('Cargo criado!');
      }

      setDialogOpen(false);
      resetForm();
      loadCargos();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar cargo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Excluir um cargo pode afetar funcionários que o utilizam.')) return;

    try {
      const { error } = await supabase.from('cargos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cargo excluído!');
      loadCargos();
    } catch (error) {
      toast.error('Erro ao excluir cargo');
    }
  };

  const openEditDialog = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setFormData({ title: cargo.title, description: cargo.description || '' });
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
        <h2 className="text-2xl font-bold text-white">Gerenciar Cargos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cargo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
              <DialogTitle>{editingCargo ? 'Editar' : 'Novo'} Cargo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingCargo ? 'Atualizar Cargo' : 'Criar Cargo')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cargos.map((cargo) => (
          <Card key={cargo.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span>{cargo.title}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(cargo)}
                    className="h-7 w-7 p-0 bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(cargo.id)}
                    className="h-7 w-7 p-0 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">{cargo.description || 'Sem descrição.'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {cargos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum cargo cadastrado
        </div>
      )}
    </div>
  );
}