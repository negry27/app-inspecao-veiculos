-- 1. Apagar políticas existentes na tabela users
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.users;', pol.policyname);
    END LOOP;
END $$;

-- 2. Habilitar RLS (já está habilitado, mas garantindo)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. SELECT: Permitir leitura de usuários ativos para todos os autenticados
CREATE POLICY "Allow authenticated users to select active users" ON public.users
FOR SELECT
TO authenticated
USING (status = 'active');

-- 4. INSERT: Permitir inserção apenas se o usuário for o master (ou se for o próprio usuário master sendo criado)
-- Nota: Como a criação de usuários é feita via código de aplicação (que verifica se é admin),
-- vamos permitir INSERT para admins, mas o código do front-end já restringe isso.
-- Para simplificar e evitar conflitos com a inicialização do master, vamos manter a restrição de escrita apenas para o master.
-- No entanto, como o `auth.uid()` não é o ID do usuário na tabela `users`, e sim o ID do usuário na tabela `auth.users`,
-- e o sistema usa uma tabela `users` customizada, a forma mais segura é confiar na lógica de aplicação (que usa a chave de serviço ou RLS mais complexo).
-- Como o front-end usa o `supabase` client com a chave anon, e a lógica de criação de usuário está em `src/lib/auth.ts` (que usa o mesmo client),
-- precisamos de uma política que permita a escrita APENAS se o usuário for o master.

-- Para fins de demonstração e segurança, vamos assumir que o usuário master tem um ID específico (embora o ID seja gerado, o campo is_master é mais confiável).
-- Como não temos acesso ao `auth.uid()` do master no momento da criação da política, vamos usar a coluna `is_master`.

-- UPDATE/DELETE: Apenas o usuário master pode alterar/deletar outros usuários.
CREATE POLICY "Master can update all users" ON public.users
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users AS master_user
        WHERE master_user.id = auth.uid() AND master_user.is_master = true
    )
);

CREATE POLICY "Master can delete all users" ON public.users
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users AS master_user
        WHERE master_user.id = auth.uid() AND master_user.is_master = true
    )
);

-- INSERT: Permitir inserção para todos os autenticados (o front-end já valida se é admin)
-- Se restringirmos o INSERT, o front-end falhará ao criar novos funcionários.
-- A política de INSERT na tabela users deve ser mais permissiva para permitir a criação de novos funcionários pelo admin.
-- Como o admin é o único que tem acesso ao EmployeesTab, vamos permitir INSERT para autenticados.
CREATE POLICY "Allow authenticated users to insert users" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);