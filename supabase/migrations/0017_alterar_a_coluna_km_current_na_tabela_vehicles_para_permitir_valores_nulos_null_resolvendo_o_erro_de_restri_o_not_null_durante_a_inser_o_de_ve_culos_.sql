-- Alterar a coluna 'km_current' para permitir valores nulos (NULL)
ALTER TABLE public.vehicles ALTER COLUMN km_current DROP NOT NULL;