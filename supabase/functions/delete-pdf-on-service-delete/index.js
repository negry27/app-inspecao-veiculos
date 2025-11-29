import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para extrair o caminho do arquivo do URL público
function extractFilePath(publicUrl) {
  try {
    const url = new URL(publicUrl);
    // O caminho deve ser algo como /storage/v1/object/public/pdf-reports/reports/filename.pdf
    // Queremos apenas reports/filename.pdf
    const pathSegments = url.pathname.split('/public/pdf-reports/');
    if (pathSegments.length > 1) {
      return pathSegments[1];
    }
    return null;
  } catch (e) {
    console.error("Error parsing URL:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // O payload do webhook do trigger de banco de dados
    const payload = await req.json();
    
    // O registro antigo (OLD) contém os dados antes da exclusão
    const oldRecord = payload.old_record;
    const pdfUrl = oldRecord?.pdf_url;

    if (!pdfUrl) {
      console.log("No PDF URL found in old record, skipping deletion.");
      return new Response(JSON.stringify({ message: "No PDF URL to delete" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const filePath = extractFilePath(pdfUrl);

    if (!filePath) {
      console.error(`Could not extract file path from URL: ${pdfUrl}`);
      return new Response(JSON.stringify({ error: "Invalid PDF URL format" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Usar o Supabase Client com a chave de serviço (SERVICE_ROLE_KEY)
    // A chave de serviço é injetada automaticamente no ambiente da Edge Function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Attempting to delete file: pdf-reports/${filePath}`);

    const { error: deleteError } = await supabaseAdmin.storage
      .from('pdf-reports')
      .remove([filePath]);

    if (deleteError) {
      // Se o erro for que o arquivo não existe, podemos ignorar
      if (deleteError.message.includes('The resource was not found')) {
        console.warn(`File not found in storage, but proceeding: ${filePath}`);
      } else {
        throw deleteError;
      }
    }

    console.log(`Successfully processed deletion for file: ${filePath}`);

    return new Response(JSON.stringify({ message: "PDF deletion processed successfully" }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error processing PDF deletion:", error);
    
    // Tratamento seguro do erro para garantir que 'message' exista
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})