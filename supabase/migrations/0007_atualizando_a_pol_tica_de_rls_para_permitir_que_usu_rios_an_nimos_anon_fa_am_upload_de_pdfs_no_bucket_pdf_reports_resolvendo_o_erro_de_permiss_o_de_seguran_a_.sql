-- 1. Remover a política de INSERT anterior
DROP POLICY IF EXISTS "pdf_reports_insert_auth" ON storage.objects;

-- 2. Criar nova política para permitir INSERT para usuários autenticados E anônimos (anon)
CREATE POLICY "pdf_reports_insert_anon_auth"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'pdf-reports');

-- 3. Garantir que a política de SELECT (leitura) pública esteja ativa
DROP POLICY IF EXISTS "pdf_reports_select_public" ON storage.objects;
CREATE POLICY "pdf_reports_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdf-reports');