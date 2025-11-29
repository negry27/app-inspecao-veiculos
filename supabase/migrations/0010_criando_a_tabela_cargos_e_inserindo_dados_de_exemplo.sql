-- Criar tabela cargos
CREATE TABLE public.cargos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (REQUIRED)
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para permitir acesso total a usuários autenticados (apenas admins usarão esta interface)
CREATE POLICY "Allow authenticated users full access to cargos" ON public.cargos 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserir cargos de exemplo
INSERT INTO public.cargos (title, description) VALUES
('Mecânico Chefe', 'Responsável pela manutenção e reparos complexos.'),
('Técnico de Inspeção', 'Realiza checklists e inspeções veiculares.'),
('Lavador de Veículos', 'Responsável pela limpeza e estética dos veículos.'),
('Gerente de Operações', 'Supervisiona todas as atividades diárias.');