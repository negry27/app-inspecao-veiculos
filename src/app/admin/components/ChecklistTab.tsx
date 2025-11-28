'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_CHECKLIST } from '@/lib/default-checklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChecklistTab() {
  const [sections, setSections] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
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

      // Se não houver checklist, inicializar com o padrão
      if (!sectionsData || sectionsData.length === 0) {
        await initializeDefaultChecklist();
      } else {
        setInitialized(true);
      }
    } catch (error) {
      toast.error('Erro ao carregar checklist');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultChecklist = async () => {
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
        <h2 className="text-2xl font-bold text-white">Gerenciar Checklist</h2>
        {!initialized && (
          <Button onClick={initializeDefaultChecklist} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Inicializar Checklist Padrão
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const sectionItems = items.filter(item => item.section_id === section.id);
          
          return (
            <Card key={section.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-white text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sectionItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
                      <div>
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          Opções: {item.options.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum checklist configurado. Clique em "Inicializar Checklist Padrão" para começar.
        </div>
      )}
    </div>
  );
}
