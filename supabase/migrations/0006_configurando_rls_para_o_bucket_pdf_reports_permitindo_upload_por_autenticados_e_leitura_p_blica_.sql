-- 1. Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "storage_reports_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_reports_select_public" ON storage.objects;
DROP POLICY IF EXISTS "pdf_reports_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "pdf_reports_select_public" ON storage.objects;

-- 2. Criar política para permitir que usuários autenticados façam upload (INSERT) no bucket 'pdf-reports'
CREATE POLICY "pdf_reports_insert_auth"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pdf-reports' AND auth.role() = 'authenticated');

-- 3. Criar política para permitir que qualquer pessoa (incluindo usuários autenticados) leia os arquivos no bucket 'pdf-reports'
CREATE POLICY "pdf_reports_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdf-reports');