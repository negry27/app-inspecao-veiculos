'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

export default function EmployeesTab() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    cargo: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEmployee) {
        // Atualizar funcionário
        const updateData: any = {
          cargo: formData.cargo,
          status: formData.status,
          updated_at: new Date().toISOString()
        };

        if (formData.password) {
          updateData.password_hash = await bcrypt.hash(formData.password, 10);
          updateData.is_temporary_password = true;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        // Criar novo funcionário
        if (!formData.username || !formData.password || !formData.cargo) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }
        
        const hashedPassword = await bcrypt.hash(formData.password, 10);

        // Usamos o username como email para satisfazer a restrição UNIQUE NOT NULL do banco
        const email = formData.username; 

        const { error } = await supabase
          .from('users')
          .insert([{
            username: formData.username,
            email: email, // Usando username como email
            password_hash: hashedPassword,
            role: 'employee',
            cargo: formData.cargo,
            status: formData.status,
            is_temporary_password: true
          }]);

        if (error) throw error;
        toast.success('Funcionário criado com sucesso!');
      }

      setDialogOpen(false);
      setEditingEmployee(null);
      setFormData({ username: '', password: '', cargo: '', status: 'active' });
      loadEmployees();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar funcionário');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Funcionário excluído com sucesso!');
      loadEmployees();
    } catch (error) {
      toast.error('Erro ao excluir funcionário');
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('Digite a nova senha temporária:');
    if (!newPassword) return;

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { error } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          is_temporary_password: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Senha resetada com sucesso!');
    } catch (error) {
      toast.error('Erro ao resetar senha');
    }
  };

  const openEditDialog = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      password: '',
      cargo: employee.cargo,
      status: employee.status
    });
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
        <h2 className="text-2xl font-bold text-white">Gerenciar Funcionários</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingEmployee(null);
              setFormData({ username: '', password: '', cargo: '', status: 'active' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Editar' : 'Novo'} Funcionário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingEmployee}
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              {/* Campo de E-mail removido */}
              <div className="space-y-2">
                <Label htmlFor="password">{editingEmployee ? 'Nova Senha (deixe vazio para não alterar)' : 'Senha Temporária'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingEmployee}
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  required
                  className="bg-[#0a0a0a] border-[#2a2a2a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                {editingEmployee ? 'Atualizar' : 'Criar'} Funcionário
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
          <Card key={employee.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>{employee.username}</span>
                <span className={`text-xs px-2 py-1 rounded ${employee.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-400">
                {/* <p><strong>Email:</strong> {employee.email}</p> Removido */}
                <p><strong>Cargo:</strong> {employee.cargo}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(employee)}
                  className="flex-1 bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResetPassword(employee.id)}
                  className="flex-1 bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(employee.id)}
                  className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum funcionário cadastrado
        </div>
      )}
    </div>
  );
}