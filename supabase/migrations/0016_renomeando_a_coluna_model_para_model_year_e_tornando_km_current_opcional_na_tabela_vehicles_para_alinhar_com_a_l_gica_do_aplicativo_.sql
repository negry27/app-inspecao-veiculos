-- Renomear a coluna 'model' para 'model_year'
ALTER TABLE public.vehicles RENAME COLUMN model TO model_year;

-- Alterar a coluna 'km_current' para permitir valores nulos (NULL)
ALTER TABLE public.vehicles ALTER COLUMN km_current DROP NOT NULL;