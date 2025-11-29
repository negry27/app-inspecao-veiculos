import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

/**
 * Inicializa o banco de dados e cria o usuário administrador master
 */
export async function initializeDatabase() {
  try {
    // Verificar se o usuário master já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'leonardo.negri@outlook.com.br')
      .single();

    if (existingUser) {
      console.log('✅ Usuário administrador master já existe');
      return { success: true, message: 'Usuário master já existe' };
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash('Leonardoo28@#!', 10);

    // Criar usuário administrador master
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: 'leonardo.negri@outlook.com.br',
        username: 'leonardo.negri@outlook.com.br',
        password_hash: hashedPassword,
        role: 'admin',
        cargo: 'Administrador Master',
        status: 'active',
        is_master: true,
        is_temporary_password: false,
        email_confirmed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Se falhar, logar o erro, mas não travar o app
      console.error('❌ Erro ao criar usuário master:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Usuário administrador master criado com sucesso!');
    return { success: true, message: 'Usuário master criado', user: newUser };
  } catch (error: any) {
    // Captura erros de conexão ou RLS que possam ocorrer durante a inicialização
    console.error('❌ Erro na inicialização do banco (initializeDatabase):', error);
    // Retorna sucesso parcial para permitir que o app continue a carregar, mas com aviso
    return { success: true, message: 'Falha na inicialização do usuário master, mas continuando o carregamento.' };
  }
}

/**
 * Verifica e cria as tabelas necessárias se não existirem
 */
export async function ensureTablesExist() {
  try {
    // Verificar se a tabela users existe tentando fazer uma query
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError && usersError.message.includes('relation')) {
      console.log('⚠️ Tabela users não existe. Por favor, execute o SQL de criação no Supabase.');
      return { 
        success: false, 
        error: 'Tabela users não encontrada. Execute o SQL de criação no dashboard do Supabase.' 
      };
    }

    console.log('✅ Tabelas verificadas com sucesso');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao verificar tabelas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * SQL para criar a tabela users (executar no Supabase SQL Editor se necessário)
 */
export const CREATE_USERS_TABLE_SQL = `
-- Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  cargo TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_master BOOLEAN DEFAULT false,
  is_temporary_password BOOLEAN DEFAULT false,
  email_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de usuários ativos
CREATE POLICY "Permitir leitura de usuários ativos" ON users
  FOR SELECT
  USING (status = 'active');

-- Política para permitir inserção (para criação do master)
CREATE POLICY "Permitir inserção de usuários" ON users
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir atualização (para mudança de senha)
CREATE POLICY "Permitir atualização de usuários" ON users
  FOR UPDATE
  USING (true);
`;