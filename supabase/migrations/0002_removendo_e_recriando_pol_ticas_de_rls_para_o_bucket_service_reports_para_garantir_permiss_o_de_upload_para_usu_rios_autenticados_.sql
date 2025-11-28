-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Allow authenticated users to upload service reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to service reports" ON storage.objects;

-- 1. Política de INSERT: Permitir que qualquer usuário autenticado faça upload no bucket 'service_reports'
CREATE POLICY "Allow authenticated users to upload service reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service_reports');

-- 2. Política de SELECT: Permitir leitura pública dos arquivos (necessário para baixar o PDF)
CREATE POLICY "Allow public read access to service reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'service_reports');