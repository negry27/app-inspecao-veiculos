-- 1. Adicionar a coluna user_id à tabela clients
ALTER TABLE public.clients
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Apagar políticas antigas de clients (que eram 'Public access for clients')
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'clients'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.clients;', pol.policyname);
    END LOOP;
END $$;

-- 3. Habilitar RLS (já estava, mas garantindo)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 4. Criar novas políticas baseadas em user_id (propriedade)

-- SELECT: Usuários autenticados só podem ver clientes que eles criaram
CREATE POLICY "users can select their clients"
ON public.clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Usuários autenticados só podem inserir clientes para si mesmos
CREATE POLICY "users can insert their clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários autenticados só podem atualizar seus clientes
CREATE POLICY "users can update their clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários autenticados só podem deletar seus clientes
CREATE POLICY "users can delete their clients"
ON public.clients
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);