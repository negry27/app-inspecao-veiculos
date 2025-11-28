-- 1. Criar política para permitir que usuários anônimos/autenticados leiam arquivos (necessário para URLs públicas)
CREATE POLICY "Allow public read access to service reports"
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'service_reports');

-- 2. Criar política para permitir que usuários autenticados insiram/atualizem arquivos (necessário para a função generateAndUploadPDF)
CREATE POLICY "Allow authenticated users to upload service reports"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'service_reports');

CREATE POLICY "Allow authenticated users to update service reports"
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'service_reports');