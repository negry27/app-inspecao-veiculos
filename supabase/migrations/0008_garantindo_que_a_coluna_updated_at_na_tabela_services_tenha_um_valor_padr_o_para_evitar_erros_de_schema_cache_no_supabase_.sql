-- Adicionar a coluna updated_at se não existir (embora o esquema diga que existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='updated_at') THEN
        ALTER TABLE public.services ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Garantir que updated_at tenha um valor padrão (se já existir, esta linha não fará nada)
ALTER TABLE public.services ALTER COLUMN updated_at SET DEFAULT NOW();