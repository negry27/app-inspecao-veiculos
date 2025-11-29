-- 1. Criar a função que chama a Edge Function
CREATE OR REPLACE FUNCTION public.delete_pdf_report()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  -- URL da Edge Function (substitua 'hbomzwcmalfmfbqqlyus' pelo seu Project ID)
  function_url TEXT := 'https://hbomzwcmalfmfbqqlyus.supabase.co/functions/v1/delete-pdf-on-service-delete';
  -- Chave de serviço (necessária para invocar funções de dentro do banco)
  service_role_key TEXT := current_setting('request.header.authorization', true);
BEGIN
  -- Verifica se o pdf_url existe antes de tentar chamar a função
  IF OLD.pdf_url IS NOT NULL THEN
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', service_role_key -- Passa a chave de serviço para autenticar a chamada
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'old_record', row_to_json(OLD)
      )
    );
  END IF;
  
  RETURN OLD;
END;
$$;

-- 2. Criar o trigger que executa a função após a exclusão
DROP TRIGGER IF EXISTS on_service_delete ON public.services;
CREATE TRIGGER on_service_delete
  AFTER DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.delete_pdf_report();