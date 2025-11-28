'use client';

import { useState } from 'react';
import { supabase, ChecklistItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItemManagerProps {
  sectionId: string;
  items: ChecklistItem[];
  onUpdate: () => void;
}

type ResponseType = 'options' | 'text' | 'datetime';

export default function ChecklistItemManager({ sectionId, items, onUpdate }: ChecklistItemManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    options: '', // Comma separated string
    order: 0,
    response_type: 'options' as ResponseType,
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ title: '', options: '', order: 0, response_type: 'options' });
  };

  const openEditDialog = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      options: item.options.join(', '),
      order: item.order,
      response_type: item.response_type as ResponseType,
    });
    setDialogOpen(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const optionsArray = formData.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
    
    if (formData.response_type === 'options' && optionsArray.length === 0) {
        toast.error('Para o tipo "Opções", as opções não podem estar vazias.');
        setLoading(false);
        return;
    }
    
    // Se o tipo não for 'options', as opções devem ser vazias
    const finalOptions = formData.response_type === 'options' ? optionsArray : [];

    const itemData = {
      section_id: sectionId,
      title: formData.title,
      options: finalOptions,
      order: formData.order,
      response_type: formData.response_type,
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('checklist_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Item atualizado!');
      } else {
        const { error } = await supabase
          .from('checklist_items')
          .insert([itemData]);

        if (error) throw error;
        toast.success('Item criado!');
      }

      setDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase.from('checklist_items').delete().eq('id', id);
      if (error) throw error;
      toast.success('Item excluído!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir item');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 h-7 text-xs"
              onClick={resetForm}
            >
              <Plus className="w-3 h-3 mr-1" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar' : 'Novo'} Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleItemSubmit} className="space-y-4">
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
                <Label htmlFor="response_type">Tipo de Resposta</Label>
                <Select 
                  value={formData.response_type} 
                  onValueChange={(value: ResponseType) => setFormData({ ...formData, response_type: value })}
                >
                  <SelectTrigger id="response_type" className="bg-[#0a0a0a] border-[#2a2a2a]">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="options">Opções (Radio Group)</SelectItem>
                    <SelectItem value="text">Texto Livre (Input)</SelectItem>
                    <SelectItem value="datetime">Data e Hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.response_type === 'options' && (
                <div className="space-y-2">
                  <Label htmlFor="options">Opções (separadas por vírgula)</Label>
                  <Input
                    id="options"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    required
                    placeholder="Ex: Ok, Gasto, Trocar"
                    className="bg-[#0a0a0a] border-[#2a2a2a]"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  required
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingItem ? 'Atualizar Item' : 'Criar Item')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
              <div>
                <p className="text-white text-sm font-medium">{item.title} (Ordem: {item.order})</p>
                <p className="text-gray-400 text-xs mt-1">
                  Tipo: <span className="capitalize">{item.response_type}</span>
                  {item.response_type === 'options' && ` | Opções: ${item.options.join(', ')}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(item)}
                  className="h-6 w-6 p-0 bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteItem(item.id)}
                  className="h-6 w-6 p-0 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center py-4">Nenhum item cadastrado nesta seção.</p>
      )}
    </div>
  );
}