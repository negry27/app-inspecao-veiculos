import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

/**
 * Realiza login do usuário
 * Aceita email ou username como identificador
 */
export async function signIn(identifier: string, password: string) {
  try {
    // Buscar usuário pelo email ou username
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${identifier},username.eq.${identifier}`);

    if (searchError) {
      console.error('Erro ao buscar usuário:', searchError);
      return { success: false, error: 'Erro ao buscar usuário' };
    }

    const user = users?.[0];

    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Verificar se está ativo
    if (user.status !== 'active') {
      return { success: false, error: 'Usuário inativo. Entre em contato com o administrador.' };
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: 'Senha inválida' };
    }

    // Salvar sessão no localStorage
    if (typeof window !== 'undefined') {
      const userSession = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        cargo: user.cargo,
        is_master: user.is_master || false,
        is_temporary_password: user.is_temporary_password || false,
        email_confirmed: user.email_confirmed || false
      };
      
      localStorage.setItem('user', JSON.stringify(userSession));
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        cargo: user.cargo,
        is_master: user.is_master || false,
        is_temporary_password: user.is_temporary_password || false,
        email_confirmed: user.email_confirmed || false
      }
    };
  } catch (error: any) {
    console.error('Erro no login:', error);
    return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
  }
}

/**
 * Realiza logout do usuário
 */
export async function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}

/**
 * Retorna o usuário atual da sessão
 */
export function getCurrentUser() {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erro ao parsear usuário:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
  }
  return null;
}

/**
 * Altera a senha do usuário
 */
export async function changePassword(userId: string, newPassword: string) {
  try {
    // Validar senha
    if (newPassword.length < 8) {
      return { success: false, error: 'A senha deve ter no mínimo 8 caracteres' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const { error } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        is_temporary_password: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }

    // Atualizar sessão local
    const currentUser = getCurrentUser();
    if (currentUser && typeof window !== 'undefined') {
      currentUser.is_temporary_password = false;
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    return { success: false, error: 'Erro ao alterar senha. Tente novamente.' };
  }
}

/**
 * Verifica se o usuário tem permissão de administrador
 */
export function isAdmin(user: any): boolean {
  return user?.role === 'admin';
}

/**
 * Verifica se o usuário é o master
 */
export function isMaster(user: any): boolean {
  return user?.is_master === true;
}

/**
 * Cria um novo usuário (apenas administradores)
 */
export async function createUser(
  email: string,
  username: string,
  password: string,
  role: 'admin' | 'employee',
  cargo?: string
) {
  try {
    const currentUser = getCurrentUser();
    
    // Verificar se o usuário atual é admin
    if (!isAdmin(currentUser)) {
      return { success: false, error: 'Apenas administradores podem criar usuários' };
    }

    // Validar dados
    if (!email || !username || !password) {
      return { success: false, error: 'Todos os campos são obrigatórios' };
    }

    if (password.length < 8) {
      return { success: false, error: 'A senha deve ter no mínimo 8 caracteres' };
    }

    // Verificar se já existe usuário com este email ou username
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email, username')
      .or(`email.eq.${email},username.eq.${username}`);

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: 'Email ou usuário já cadastrado' };
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        username,
        password_hash: hashedPassword,
        role,
        cargo: cargo || (role === 'admin' ? 'Administrador' : 'Funcionário'),
        status: 'active',
        is_master: false,
        is_temporary_password: true,
        email_confirmed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, error: 'Erro ao criar usuário' };
    }

    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return { success: false, error: 'Erro ao criar usuário. Tente novamente.' };
  }
}

/**
 * Atualiza dados de um usuário (apenas administradores)
 */
export async function updateUser(
  userId: string,
  updates: {
    email?: string;
    username?: string;
    cargo?: string;
    status?: 'active' | 'inactive';
  }
) {
  try {
    const currentUser = getCurrentUser();
    
    // Verificar se o usuário atual é admin
    if (!isAdmin(currentUser)) {
      return { success: false, error: 'Apenas administradores podem atualizar usuários' };
    }

    // Não permitir atualizar o próprio status
    if (userId === currentUser.id && updates.status === 'inactive') {
      return { success: false, error: 'Você não pode desativar sua própria conta' };
    }

    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, error: 'Erro ao atualizar usuário' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return { success: false, error: 'Erro ao atualizar usuário. Tente novamente.' };
  }
}

/**
 * Reseta a senha de um usuário para uma senha temporária (apenas administradores)
 */
export async function resetUserPassword(userId: string, newTemporaryPassword: string) {
  try {
    const currentUser = getCurrentUser();
    
    // Verificar se o usuário atual é admin
    if (!isAdmin(currentUser)) {
      return { success: false, error: 'Apenas administradores podem resetar senhas' };
    }

    if (newTemporaryPassword.length < 8) {
      return { success: false, error: 'A senha deve ter no mínimo 8 caracteres' };
    }

    const hashedPassword = await bcrypt.hash(newTemporaryPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        is_temporary_password: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao resetar senha:', error);
      return { success: false, error: 'Erro ao resetar senha' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    return { success: false, error: 'Erro ao resetar senha. Tente novamente.' };
  }
}

/**
 * Deleta um usuário (apenas administradores, não pode deletar master)
 */
export async function deleteUser(userId: string) {
  try {
    const currentUser = getCurrentUser();
    
    // Verificar se o usuário atual é admin
    if (!isAdmin(currentUser)) {
      return { success: false, error: 'Apenas administradores podem deletar usuários' };
    }

    // Verificar se está tentando deletar a si mesmo
    if (userId === currentUser.id) {
      return { success: false, error: 'Você não pode deletar sua própria conta' };
    }

    // Verificar se o usuário a ser deletado é master
    const { data: userToDelete } = await supabase
      .from('users')
      .select('is_master')
      .eq('id', userId)
      .single();

    if (userToDelete?.is_master) {
      return { success: false, error: 'Não é possível deletar o usuário master' };
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Erro ao deletar usuário:', error);
      return { success: false, error: 'Erro ao deletar usuário' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    return { success: false, error: 'Erro ao deletar usuário. Tente novamente.' };
  }
}
