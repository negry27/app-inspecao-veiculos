import { generateServicePDF } from './pdf-generator';
import { supabase, Service, Client, Vehicle, ChecklistSection, ChecklistItem } from './supabase';
import { format } from 'date-fns';

interface Employee {
  username: string;
  cargo: string;
}

interface ServiceDetails {
  service: Service;
  client: Client;
  vehicle: Vehicle;
  employee: Employee;
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
          const answer = service.checklist_data?.[section.id]?.[item.id] ?? null;
          let displayValue = 'Não Respondido';

          if (answer) {
            displayValue = answer;

            if (item.response_type === 'datetime') {
              try {
                displayValue = format(new Date(answer), 'dd/MM/yyyy HH:mm');
              } catch {
                displayValue = answer;
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
      observations: service.observations || '',
      photos: service.photos || [],
      date: format(new Date(service.created_at), 'dd/MM/yyyy HH:mm'),
    };

    // 2. Gerar o Blob do PDF
    const pdfBlob = await generateServicePDF(pdfData);

    if (!(pdfBlob instanceof Blob)) {
      throw new Error('O PDF gerado não é um Blob válido.');
    }

    // 3. Fazer upload para o Supabase Storage
    const fileName = `${service.id}-${format(new Date(), 'yyyyMMddHHmmss')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdf-reports')
      .upload(`reports/${fileName}.pdf`, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) throw uploadError;

    // 4. Obter a URL pública
    const { data: publicUrlData } = supabase.storage
      .from('pdf-reports')
      .getPublicUrl(`reports/${fileName}.pdf`);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Não foi possível gerar URL pública do PDF.');
    }

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
