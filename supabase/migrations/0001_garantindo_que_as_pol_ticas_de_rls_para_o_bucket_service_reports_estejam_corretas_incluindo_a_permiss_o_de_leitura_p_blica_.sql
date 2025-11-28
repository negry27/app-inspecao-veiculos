-- 1. Habilitar RLS no bucket (se ainda não estiver)
-- Nota: Esta linha é um comentário, pois deve ser feita no console do Supabase.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 

-- 2. Garantir que a política de INSERT exista (se falhar, significa que já existe e está OK)
DROP POLICY IF EXISTS "Allow authenticated users to upload service reports" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload service reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service_reports');

-- 3. Garantir que a política de SELECT (leitura pública) exista
DROP POLICY IF EXISTS "Allow public read access to service reports" ON storage.objects;
CREATE POLICY "Allow public read access to service reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'service_reports');