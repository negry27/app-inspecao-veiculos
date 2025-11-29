-- 1. Apagar a política de INSERT existente na tabela users
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON public.users;

-- 2. Recriar a política de INSERT para incluir anon e authenticated
CREATE POLICY "Allow anon and authenticated users to insert users" ON public.users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);