import { generateServicePDF } from './pdf-generator';
import { supabase, Service, Client, Vehicle, ChecklistSection, ChecklistItem } from './supabase';
import { format } from 'date-fns';

interface ServiceDetails {
  service: Service;
  client: Client;
  vehicle: Vehicle;
  employee: any; // User type
  sections: ChecklistSection[];
  items: ChecklistItem[];
}

/**
 * Gera o PDF do relatório de inspeção, faz upload para o Supabase Storage
 * e atualiza o registro do serviço com a URL do PDF.
 */
export async function generateAndUploadPDF(details: ServiceDetails): Promise<{ success: boolean, pdfUrl?: string, error?: string }> {
  try {
    const { service, client, vehicle, employee, sections, items } = details;

    // 1. Preparar dados para o PDF
    const checklistDataFormatted = sections.map(section => {
      const sectionItems = items
        .filter(item => item.section_id === section.id)
        .map(item => {
          // Acessa a resposta do checklist_data do serviço
          const answer = service.checklist_data[section.id]?.[item.id];
          let displayValue = 'Não Respondido';
          
          if (answer) {
            displayValue = answer;
            
            // Formatação especial para datetime
            if (item.response_type === 'datetime') {
              try {
                displayValue = format(new Date(answer), 'dd/MM/yyyy HH:mm');
              } catch (e) {
                displayValue = answer; // Fallback
              }
            }
          }

          return {
            title: item.title,
            value: displayValue,
          };
        });

      return {
        section: section.title,
        items: sectionItems,
      };
    });

    const pdfData = {
      employee: {
        name: employee.username || 'N/A',
        cargo: employee.cargo || 'N/A',
      },
      client: {
        name: client.name,
        phone: client.phone,
      },
      vehicle: {
        type: vehicle.type,
        model: vehicle.model,
        plate: vehicle.plate,
        km: vehicle.km_current,
      },
      checklist: checklistDataFormatted,
      observations: service.observations,
      photos: service.photos || [],
      date: format(new Date(service.created_at), 'dd/MM/yyyy HH:mm'),
    };

    // 2. Gerar o Blob do PDF
    const pdfBlob = await generateServicePDF(pdfData);
    
    // 3. Fazer upload para o Supabase Storage
    const fileName = `reports/${service.id}-${format(new Date(), 'yyyyMMddHHmmss')}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('service_reports') // Assumindo que existe um bucket chamado 'service_reports'
      .upload(fileName, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) throw uploadError;

    // 4. Obter a URL pública
    const { data: publicUrlData } = supabase.storage
      .from('service_reports')
      .getPublicUrl(fileName);
      
    const publicUrl = publicUrlData.publicUrl;

    // 5. Atualizar o registro do serviço no banco de dados
    const { error: updateError } = await supabase
      .from('services')
      .update({ pdf_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', service.id);

    if (updateError) throw updateError;

    return { success: true, pdfUrl: publicUrl };

  } catch (error: any) {
    console.error('Erro ao gerar e fazer upload do PDF:', error);
    return { success: false, error: error.message || 'Erro desconhecido ao gerar PDF.' };
  }
}