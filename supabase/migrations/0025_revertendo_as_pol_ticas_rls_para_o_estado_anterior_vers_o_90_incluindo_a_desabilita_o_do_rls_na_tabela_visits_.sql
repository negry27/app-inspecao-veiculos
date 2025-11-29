-- 1. Apagar todas as políticas existentes nas tabelas users e visits
SELECT drop_all_policies('users');
SELECT drop_all_policies('visits');

-- 2. Configurar RLS para a tabela users (Estado anterior)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT: Permitir leitura de usuários ativos para todos os autenticados
CREATE POLICY "Allow authenticated users to select active users" ON public.users
FOR SELECT
TO authenticated
USING (status = 'active');

-- INSERT: Permitir inserção para todos os autenticados
CREATE POLICY "Allow authenticated users to insert users" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Permitir atualização para todos os autenticados
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

-- 3. Configurar RLS para a tabela visits (Estado anterior: RLS desabilitado, mas políticas definidas)
-- Desabilitar RLS (se estiver habilitado)
ALTER TABLE public.visits DISABLE ROW LEVEL SECURITY;

-- Recriar políticas (elas não serão aplicadas enquanto RLS estiver desabilitado)
CREATE POLICY "visits_select_policy" ON public.visits
FOR SELECT
TO authenticated
USING (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())));

CREATE POLICY "visits_insert_policy" ON public.visits
FOR INSERT
TO authenticated
WITH CHECK (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())));

CREATE POLICY "visits_update_policy" ON public.visits
FOR UPDATE
TO authenticated
USING (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())))
WITH CHECK (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())));

CREATE POLICY "visits_delete_policy" ON public.visits
FOR DELETE
TO authenticated
USING (client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid())));