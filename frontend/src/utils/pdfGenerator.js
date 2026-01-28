import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BACKEND_URL } from '../services/api';

export const generateServiceTicket = async (repair, settings = {}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const businessName = settings.business_name || 'SysTeck';
    const contactInfo = [settings.contact_email, settings.contact_phone].filter(Boolean).join(' | ');

    // Header
    doc.setFillColor(23, 23, 23); // #171717
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(218, 0, 55); // #DA0037
    doc.setFontSize(24);
    doc.text(businessName, 20, 20);

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    doc.text(contactInfo, 20, 28);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Comprobante de Servicio', 20, 38);

    doc.setFontSize(10);
    doc.text(`Ticket #${repair.ticket_number}`, pageWidth - 60, 20);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - 60, 26);

    // Info Cliente y Equipo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Información del Servicio', 20, 60);

    const repairDetails = [
        ['Cliente', `${repair.first_name} ${repair.last_name}`],
        ['Dispositivo', repair.device_type_name],
        ['Modelo', repair.model],
        ['Servicio', repair.service_name || repair.service_requested],
        ['Estado Final', repair.status === 'delivered' ? 'Entregado' : repair.status],
        ['Garantía', `${repair.warranty_days} días`]
    ];

    autoTable(doc, {
        startY: 65,
        head: [],
        body: repairDetails,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
    });

    // Costos
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Detalle de Costos', 20, finalY);

    const costs = [
        ['Diagnóstico', `$${repair.diagnosis_cost}`],
        ['Mano de Obra', `$${repair.labor_cost}`],
        ['Refacciones', `$${repair.parts_cost}`],
        ['Descuento', `-$${repair.discount}`],
        ['TOTAL', `$${repair.total_cost}`],
        ['Anticipo', `-$${repair.advance_payment}`],
        ['Saldo Final', `$${repair.total_cost - repair.advance_payment}`]
    ];

    autoTable(doc, {
        startY: finalY + 5,
        head: [],
        body: costs,
        theme: 'striped',
        styles: { fontSize: 10 },
        columnStyles: { 0: { width: 100 }, 1: { fontStyle: 'bold', halign: 'right' } }
    });

    // Firmas
    finalY = doc.lastAutoTable.finalY + 20;

    // Validar espacio en página
    if (finalY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        finalY = 20;
    }

    if (repair.signature_approval) {
        doc.setFontSize(10);
        doc.text('Aprobación de Cotización', 40, finalY);
        doc.addImage(repair.signature_approval, 'PNG', 40, finalY + 5, 50, 25);
    }

    if (repair.signature_delivery) {
        doc.setFontSize(10);
        doc.text('Conformidad de Entrega', 120, finalY);
        doc.addImage(repair.signature_delivery, 'PNG', 120, finalY + 5, 50, 25);
    }

    // Footer Legal
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100);
    const terms = `Al firmar de conformidad, el cliente acepta haber revisado el equipo y estar satisfecho con el servicio. La garantía cubre únicamente la reparación realizada por ${businessName}. No nos hacemos responsables por equipos no reclamados después de 30 días.`;
    doc.text(doc.splitTextToSize(terms, pageWidth - 40), 20, pageHeight - 30);

    doc.save(`Ticket_${repair.ticket_number}.pdf`);
};
