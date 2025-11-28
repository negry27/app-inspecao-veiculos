'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Database, CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SetupInstructions() {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- Execute este SQL no Supabase SQL Editor
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de usuários ativos" ON users
  FOR SELECT USING (status = 'active');

CREATE POLICY "Permitir inserção de usuários" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de usuários" ON users
  FOR UPDATE USING (true);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    toast.success('SQL copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] p-4 flex items-center justify-center">
      <Card className="w-full max-w-3xl bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <Database className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Configuração Inicial Necessária
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure o banco de dados do Supabase para começar a usar o sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Passo 1 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">Configure as Variáveis de Ambiente</h3>
                <Alert className="bg-blue-500/10 border-blue-500/20">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300 text-sm">
                    Vá em <strong>Configurações do Projeto → Integrações → Supabase</strong> e conecte sua conta
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">Execute o SQL no Supabase</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Copie o SQL abaixo e execute no <strong>SQL Editor</strong> do seu projeto Supabase
                </p>
                
                <div className="relative">
                  <pre className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 text-xs text-gray-300 overflow-x-auto max-h-64">
                    {sqlScript}
                  </pre>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar SQL
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  variant="outline"
                  className="mt-3 w-full border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Supabase Dashboard
                </Button>
              </div>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">Recarregue a Página</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Após executar o SQL, recarregue esta página. O sistema criará automaticamente o usuário administrador master.
                </p>
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300 text-sm">
                    <strong>Credenciais do Administrador Master:</strong><br />
                    E-mail: leonardo.negri@outlook.com.br<br />
                    Senha: Leonardoo28@#!
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>

          {/* Botão de Recarregar */}
          <div className="pt-4 border-t border-[#2a2a2a]">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Já Executei o SQL - Recarregar Página
            </Button>
          </div>

          {/* Informação Adicional */}
          <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
            <p className="text-xs text-gray-400 text-center">
              💡 <strong>Dica:</strong> Você só precisa fazer isso uma vez. Após a configuração inicial, o sistema funcionará normalmente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
