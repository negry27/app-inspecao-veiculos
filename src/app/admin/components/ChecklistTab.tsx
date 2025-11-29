'use client';

import { useState, useEffect } from 'react';
import { supabase, ChecklistSection, ChecklistItem } from '@/lib/supabase';
import { DEFAULT_CHECKLIST } from '@/lib/default-checklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ChecklistItemManager from './ChecklistItemManager';

export default function ChecklistTab() {
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Section Dialog State
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ChecklistSection | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: '', order: 0 });
  const [savingSection, setSavingSection] = useState(false);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    setLoading(true);
    try {
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

      setSections(sectionsData || []);
      setItems(itemsData || []);

      // Check initialization status based on loaded data
      if (sectionsData && sectionsData.length > 0) {
        setInitialized(true);
      } else {
        setInitialized(false);
      }
    } catch (error) {
      toast.error('Erro ao carregar checklist');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultChecklist = async () => {
    setLoading(true);
    try {
      for (const section of DEFAULT_CHECKLIST) {
        const { data: sectionData, error: sectionError } = await supabase
          .from('checklist_sections')
          .insert([{ title: section.title, order: section.order }])
          .select()
          .single();

        if (sectionError) throw sectionError;

        for (const item of section.items) {
          const { error: itemError } = await supabase
            .from('checklist_items')
            .insert([{
              section_id: sectionData.id,
              title: item.title,
              options: item.options,
              order: item.order
            }]);

          if (itemError) throw itemError;
        }
      }

      toast.success('Checklist padrão inicializado!');
      setInitialized(true);
      loadChecklist();
    } catch (error) {
      toast.error('Erro ao inicializar checklist');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection(true);

    try {
      if (editingSection) {
        // Update Section
        const { error } = await supabase
          .from('checklist_sections')
          .update({ title: sectionForm.title, order: sectionForm.order })
          .eq('id', editingSection.id);

        if (error) throw error;
        toast.success('Seção atualizada!');
      } else {
        // Create Section
        const { error } = await supabase
          .from('checklist_sections')
          .insert([{ title: sectionForm.title, order: sectionForm.order }]);

        if (error) throw error;
        toast.success('Seção criada!');
      }

      setSectionDialogOpen(false);
      setEditingSection(null);
      setSectionForm({ title: '', order: 0 });
      loadChecklist();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar seção');
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Tem certeza? Isso excluirá a seção e todos os itens associados.')) return;

    try {
      const { error } = await supabase.from('checklist_sections').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Seção excluída!');
      loadChecklist();
    } catch (error) {
      toast.error('Erro ao excluir seção');
    }
  };

  const openEditSectionDialog = (section: ChecklistSection) => {
    setEditingSection(section);
    setSectionForm({ title: section.title, order: section.order });
    setSectionDialogOpen(true);
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
        <h2 className="text-2xl font-bold text-white">Gerenciar Checklist</h2>
        <div className="flex gap-2">
          {!initialized && (
            <Button onClick={initializeDefaultChecklist} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Inicializar Padrão
            </Button>
          )}
          
          <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setEditingSection(null);
                  setSectionForm({ title: '', order: sections.length + 1 });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Seção
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <DialogHeader>
                <DialogTitle>{editingSection ? 'Editar' : 'Nova'} Seção</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSectionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sectionTitle">Título da Seção</Label>
                  <Input
                    id="sectionTitle"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                    required
                    className="bg-[#0a0a0a] border-[#2a2a2a]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sectionOrder">Ordem</Label>
                  <Input
                    id="sectionOrder"
                    type="number"
                    value={sectionForm.order}
                    onChange={(e) => setSectionForm({ ...sectionForm, order: parseInt(e.target.value) || 0 })}
                    required
                    className="bg-[#0a0a0a] border-[#2a2a2a]"
                  />
                </div>
                <Button type="submit" disabled={savingSection} className="w-full bg-blue-600 hover:bg-blue-700">
                  {savingSection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingSection ? 'Atualizar Seção' : 'Criar Seção')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const sectionItems = items.filter(item => item.section_id === section.id);
          
          return (
            <Card key={section.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-white text-lg">
                  {section.title} 
                  <span className="text-sm text-gray-500 ml-2">(Ordem: {section.order})</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditSectionDialog(section)}
                    className="h-8 bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteSection(section.id)}
                    className="h-8 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ChecklistItemManager 
                  sectionId={section.id} 
                  items={sectionItems} 
                  onUpdate={loadChecklist} 
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum checklist configurado. Clique em "Inicializar Checklist Padrão" para começar ou "Nova Seção" para criar manualmente.
        </div>
      )}
    </div>
  );
}