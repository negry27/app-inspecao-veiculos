-- Remove a tabela se já existir (usando CASCADE para remover dependências)
DROP TABLE IF EXISTS public.vehicles CASCADE;

-- Cria a tabela novamente com todas as colunas usadas no seu código
CREATE TABLE public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- Corrigido para UUID
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE, -- Corrigido para UUID
    type TEXT NOT NULL,                     -- car, moto, truck...
    model_year TEXT NOT NULL,               -- modelo/ano juntos
    plate VARCHAR(10) NOT NULL,             -- placa alfanumérica limpa
    driver_name TEXT NULL,                  -- nome do motorista (opcional)
    observations TEXT NULL,                 -- observações (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Adicionado para consistência
);

-- Índice para facilitar busca por placa (opcional porém recomendado)
CREATE INDEX vehicles_plate_idx ON public.vehicles (plate);

-- Ativar Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Política: todos podem selecionar
CREATE POLICY "Allow select for all" 
ON public.vehicles
FOR SELECT
TO public
USING (true);

-- Política: authenticated pode inserir
CREATE POLICY "Allow authenticated insert"
ON public.vehicles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: authenticated pode atualizar
CREATE POLICY "Allow authenticated update"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: authenticated pode deletar
CREATE POLICY "Allow authenticated delete"
ON public.vehicles
FOR DELETE
TO authenticated
USING (true);