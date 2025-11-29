-- ============================================
-- 1. HABILITAR RLS (Garantindo)
-- ============================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. APAGAR TODAS AS POLICIES EXISTENTES
-- ============================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'vehicles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.vehicles;', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- 3. CRIAR NOVAS POLICIES
-- ============================================

-- SELECT: usuário só pode ver veículos de clientes que pertencem a ele
CREATE POLICY "users can select their vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.user_id = auth.uid()
  )
);

-- INSERT: só pode inserir veículos em clientes que pertencem ao usuário
CREATE POLICY "users can insert their vehicles"
ON public.vehicles
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.user_id = auth.uid()
  )
);

-- UPDATE: só pode alterar veículos dos seus clientes
CREATE POLICY "users can update their vehicles"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.user_id = auth.uid()
  )
);

-- DELETE: só pode excluir veículos dos seus clientes
CREATE POLICY "users can delete their vehicles"
ON public.vehicles
FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.user_id = auth.uid()
  )
);