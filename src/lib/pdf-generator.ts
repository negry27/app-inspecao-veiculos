import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    model: string;
    plate: string;
    km: number;
  };
  checklist: {
    section: string;
    items: { title: string; value: string }[];
  }[];
  observations?: string;
  photos: string[];
  date: string;
}

export async function generateServicePDF(data: PDFData): Promise<Blob> {
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
  doc.text(`Data: ${data.date}`, 20, yPosition);
  yPosition += 10;

  // Informações do Funcionário
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Funcionário', 20, yPosition);
  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${data.employee.name}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Cargo: ${data.employee.cargo}`, 20, yPosition);
  yPosition += 10;

  // Informações do Cliente
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', 20, yPosition);
  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${data.client.name}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Telefone: ${data.client.phone}`, 20, yPosition);
  yPosition += 10;

  // Informações do Veículo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Veículo', 20, yPosition);
  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo: ${data.vehicle.type}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Modelo: ${data.vehicle.model}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Placa: ${data.vehicle.plate}`, 20, yPosition);
  yPosition += 5;
  doc.text(`KM: ${data.vehicle.km}`, 20, yPosition);
  yPosition += 15;

  // Checklist
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Checklist de Inspeção', 20, yPosition);
  yPosition += 10;

  data.checklist.forEach((section) => {
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
  if (data.observations) {
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
    const splitText = doc.splitTextToSize(data.observations, 170);
    doc.text(splitText, 20, yPosition);
  }

  // Fotos
  if (data.photos.length > 0) {
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Fotos Anexadas', 20, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de fotos: ${data.photos.length}`, 20, yPosition);
  }

  return doc.output('blob');
}
