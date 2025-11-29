-- 1. Remover políticas existentes que possam ter nomes diferentes
DROP POLICY IF EXISTS "Allow authenticated users to upload reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to reports" ON storage.objects;
DROP POLICY IF EXISTS "Public access for reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- 2. Criar política para permitir que usuários autenticados façam upload (INSERT) no bucket 'service_reports'
CREATE POLICY "storage_reports_insert_auth"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service_reports' AND auth.role() = 'authenticated');

-- 3. Criar política para permitir que qualquer pessoa (incluindo usuários autenticados) leia os arquivos no bucket 'service_reports'
CREATE POLICY "storage_reports_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service_reports');