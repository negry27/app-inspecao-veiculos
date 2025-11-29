-- Função auxiliar para apagar todas as políticas de uma tabela
CREATE OR REPLACE FUNCTION drop_all_policies(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = table_name
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%s;', pol.policyname, table_name);
    END LOOP;
END;
$$;

-- 1. Apagar políticas existentes na tabela users
SELECT drop_all_policies('users');

-- 2. RLS na tabela users (Permissivo para inicialização do master)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT: Permitir leitura de usuários ativos para todos os autenticados
CREATE POLICY "Allow authenticated users to select active users" ON public.users
FOR SELECT
TO authenticated
USING (status = 'active');

-- INSERT: Permitir inserção para todos os autenticados (necessário para a lógica de criação do master no front-end)
CREATE POLICY "Allow authenticated users to insert users" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Permitir atualização para todos os autenticados (necessário para a mudança de senha)
CREATE POLICY "Allow authenticated users to update users" ON public.users
FOR UPDATE
TO authenticated
USING (true);

-- DELETE: Apenas o master pode deletar (usando a coluna is_master)
CREATE POLICY "Master can delete all users" ON public.users
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users AS master_user
        WHERE master_user.id = auth.uid() AND master_user.is_master = true
    )
);

-- 3. Apagar políticas existentes na tabela visits
SELECT drop_all_policies('visits');

-- 4. Habilitar RLS na tabela visits (Regra de segurança obrigatória)
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 5. Recriar políticas RLS para visits
-- SELECT: Apenas visitas de clientes do usuário logado
CREATE POLICY "visits_select_policy" ON public.visits
FOR SELECT
TO authenticated
USING (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())));

-- INSERT: Apenas visitas de clientes do usuário logado
CREATE POLICY "visits_insert_policy" ON public.visits
FOR INSERT
TO authenticated
WITH CHECK (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())));

-- UPDATE: Apenas visitas de clientes do usuário logado
CREATE POLICY "visits_update_policy" ON public.visits
FOR UPDATE
TO authenticated
USING (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())))
WITH CHECK (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())));

-- DELETE: Apenas visitas de clientes do usuário logado
CREATE POLICY "visits_delete_policy" ON public.visits
FOR DELETE
TO authenticated
USING (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())));