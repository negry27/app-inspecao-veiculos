'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VehicleFormDialogProps {
  clientId: string;
  onSave: () => void;
}

export default function VehicleFormDialog({ clientId, onSave }: VehicleFormDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    type: 'car' as 'car' | 'motorcycle' | 'van',
    model: '',
    year: '',
    plate: '',
    driver_name: '', 
    observations: ''
  });

  const resetForm = () => {
    setVehicleForm({
      type: 'car',
      model: '',
      year: '',
      plate: '',
      driver_name: '',
      observations: ''
    });
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() });
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const model = vehicleForm.model.trim();
    const year = vehicleForm.year.trim();
    const rawPlate = vehicleForm.plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (!model || !year || !rawPlate) {
      toast.error("Modelo, Ano e Placa são obrigatórios.");
      setSaving(false);
      return;
    }

    if (rawPlate.length < 7) {
      toast.error("A placa deve ter no mínimo 7 caracteres alfanuméricos.");
      setSaving(false);
      return;
    }

    const modelYearCombined = `${model}/${year}`;

    try {
      const { error } = await supabase.from("vehicles").insert([
        {
          client_id: clientId,
          type: vehicleForm.type,
          model_year: modelYearCombined,
          plate: rawPlate,
          driver_name: vehicleForm.driver_name || null,
          observations: vehicleForm.observations || null,
        },
      ]);

      if (error) {
        console.error("ERRO SUPABASE:", error);
        toast.error(`Erro ao adicionar veículo: ${error.message}`);
        return;
      }

      toast.success("Veículo adicionado!");
      setDialogOpen(false);
      resetForm();
      onSave();
    } catch (err: any) {
      console.error("ERRO DESCONHECIDO:", err);
      toast.error("Erro inesperado ao adicionar o veículo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          onClick={resetForm}
          className="bg-green-600 hover:bg-green-700 h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Adicionar Veículo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleVehicleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={vehicleForm.type} onValueChange={(value: any) => setVehicleForm({ ...vehicleForm, type: value })} disabled={saving}>
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
                      disabled={saving}
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
                      disabled={saving}
                      className="bg-[#0a0a0a] border-[#2a2a2a]"
                  />
              </div>
          </div>
          
          <div className="space-y-2">
            <Label>Placa</Label>
            <Input
              value={vehicleForm.plate}
              onChange={handlePlateChange}
              required
              maxLength={8}
              placeholder="ABC1234 ou ABC-1234"
              disabled={saving}
              className="bg-[#0a0a0a] border-[#2a2a2a]"
            />
          </div>
          <div className="space-y-2">
            <Label>Motorista (Opcional)</Label>
            <Input
              value={vehicleForm.driver_name}
              onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })}
              disabled={saving}
              className="bg-[#0a0a0a] border-[#2a2a2a]"
            />
          </div>
          <div className="space-y-2">
            <Label>Observações (Opcional)</Label>
            <Textarea
              value={vehicleForm.observations}
              onChange={(e) => setVehicleForm({ ...vehicleForm, observations: e.target.value })}
              disabled={saving}
              className="bg-[#0a0a0a] border-[#2a2a2a]"
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Adicionar Veículo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}