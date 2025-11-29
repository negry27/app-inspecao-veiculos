import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Client, Vehicle, ChecklistSection, ChecklistItem, supabase } from './supabase'; // Importando tipos e supabase
import { format } from 'date-fns';

interface Employee {
  username: string;
  cargo?: string; // Corrigido para ser opcional
}

interface PDFData {
  employee: {
    name: string;
    cargo: string;
  };
  client: {
    name: string;
    phone: string;
  };
  vehicle: {
    type: string;
    model_year: string; // Alterado de 'model' para 'model_year'
    plate: string;
    driver_name?: string; 
    km_current?: number; // Adicionado km_current
  };
  checklist: {
    section: string;
    items: { title: string; value: string }[];
  }[];
  observations?: string;
  photos: string[];
  date: string;
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

    // Priorizar dados embutidos no __meta se existirem
    const embeddedClient = service.checklist_data?.__meta?.client_details;
    const embeddedVehicle = service.checklist_data?.__meta?.vehicle_details;
    const embeddedEmployee = service.checklist_data?.__meta?.employee_details;
    
    const finalClient = embeddedClient || client;
    const finalVehicle = embeddedVehicle || vehicle;
    const finalEmployee = embeddedEmployee || employee;


    const pdfData: PDFData = {
      employee: {
        name: finalEmployee.username || 'N/A',
        cargo: finalEmployee.cargo || 'N/A',
      },
      client: {
        name: finalClient.name,
        phone: finalClient.phone,
      },
      vehicle: {
        type: finalVehicle.type,
        model_year: finalVehicle.model_year, // Usando model_year
        plate: finalVehicle.plate,
        driver_name: finalVehicle.driver_name, 
        km_current: (finalVehicle as any).km_current, // km_current não está na interface Vehicle, mas pode estar no DB
      },
      checklist: checklistDataFormatted,
      observations: service.observations || '',
      photos: service.photos || [],
      date: format(new Date(service.created_at), 'dd/MM/yyyy HH:mm'),
    };

    // 2. Gerar o Blob do PDF
    const doc = new jsPDF();
    let yPosition = 20;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Inspeção e Lavagem', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Data
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${pdfData.date}`, 20, yPosition);
    yPosition += 10;

    // Informações do Funcionário
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Funcionário', 20, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${pdfData.employee.name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Cargo: ${pdfData.employee.cargo}`, 20, yPosition);
    yPosition += 10;

    // Informações do Cliente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente', 20, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${pdfData.client.name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Telefone: ${pdfData.client.phone}`, 20, yPosition);
    yPosition += 10;

    // Informações do Veículo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Veículo', 20, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${pdfData.vehicle.type}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Modelo/Ano: ${pdfData.vehicle.model_year}`, 20, yPosition); // Usando model_year
    yPosition += 5;
    doc.text(`Placa: ${pdfData.vehicle.plate}`, 20, yPosition);
    yPosition += 5;
    if (pdfData.vehicle.driver_name) {
        doc.text(`Motorista: ${pdfData.vehicle.driver_name}`, 20, yPosition); 
        yPosition += 5;
    }
    if (pdfData.vehicle.km_current) {
        doc.text(`KM Atual: ${pdfData.vehicle.km_current}`, 20, yPosition); 
        yPosition += 5;
    }
    yPosition += 10; // Espaçamento após informações do veículo

    // Checklist
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Checklist de Inspeção', 20, yPosition);
    yPosition += 10;

    pdfData.checklist.forEach((section) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(section.section, 20, yPosition);
      yPosition += 7;

      const tableData = section.items.map(item => [item.title, item.value]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    });

    // Observações
    if (pdfData.observations) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações', 20, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(pdfData.observations, 170);
      doc.text(splitText, 20, yPosition);
      yPosition += splitText.length * 5 + 10;
    }

    // Fotos
    if (pdfData.photos.length > 0) {
      doc.addPage();
      yPosition = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Fotos Anexadas', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de fotos: ${pdfData.photos.length}`, 20, yPosition);
    }

    const pdfBlob = doc.output('blob');

    if (!(pdfBlob instanceof Blob)) {
      throw new Error('O PDF gerado não é um Blob válido.');
    }

    // 3. Fazer upload para o Supabase Storage usando 'pdf-reports'
    const fileName = `${service.id}-${format(new Date(), 'yyyyMMddHHmmss')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdf-reports') // <-- Bucket atualizado para 'pdf-reports'
      .upload(`reports/${fileName}.pdf`, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) throw uploadError;

    // 4. Obter a URL pública
    const { data: publicUrlData } = supabase.storage
      .from('pdf-reports') // <-- Bucket atualizado para 'pdf-reports'
      .getPublicUrl(`reports/${fileName}.pdf`);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Não foi possível gerar URL pública do PDF.');
    }

    const publicUrl = publicUrlData.publicUrl;

    // 5. Atualizar o registro do serviço no banco de dados
    // Removendo a atualização explícita de updated_at para evitar erro de schema cache
    const { error: updateError } = await supabase
      .from('services')
      .update({ pdf_url: publicUrl })
      .eq('id', service.id);

    if (updateError) throw updateError;

    return { success: true, pdfUrl: publicUrl };

  } catch (error: any) {
    console.error('Erro ao gerar e fazer upload do PDF:', error);
    return { success: false, error: error.message || 'Erro desconhecido ao gerar PDF.' };
  }
}