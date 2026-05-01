import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './constants';

export const generateServiceTicket = (repair, settings = {}) => {
    // A4 Format: 210mm x 297mm
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Theme Colors
    const primaryColor = [218, 0, 55]; // #DA0037
    const darkColor = [30, 30, 30];    // ~#1e1e1e
    const mutedColor = [120, 120, 120];

    const businessName = settings.business_name || 'SysTeck';
    const contactEmail = settings.contact_email || '';
    const contactPhone = settings.contact_phone || '';

    let currentY = 15;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(businessName, 15, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    let contactInfo = [];
    if (contactPhone) contactInfo.push(`Tel: ${contactPhone}`);
    if (contactEmail) contactInfo.push(contactEmail);
    doc.text(contactInfo.join(' | '), 15, currentY + 14);

    // Ticket Number (Top Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const ticketText = `TICKET #${repair.ticket_number}`;
    const ticketWidth = doc.getTextWidth(ticketText);
    doc.text(ticketText, pageWidth - 15 - ticketWidth, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const dateText = `Fecha: ${formatDate(new Date())}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - 15 - dateWidth, currentY + 14);

    // Separator line
    currentY += 22;
    doc.setDrawColor(220, 220, 220);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 10;

    // --- Section: Información del Cliente ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Información del Cliente', 15, currentY);
    currentY += 6;

    const customerDetails = [
        ['Nombre:', `${repair.customer_first_name || repair.first_name} ${repair.customer_last_name || repair.last_name}`],
        ['Teléfono:', repair.customer_phone || 'No registrado'],
        ['Email:', repair.customer_email || 'No registrado']
    ];

    autoTable(doc, {
        startY: currentY,
        body: customerDetails,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1, textColor: darkColor },
        columnStyles: { 0: { fontStyle: 'bold', width: 30, textColor: mutedColor } },
        margin: { left: 15 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // --- Section: Detalles del Dispositivo ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Detalles del Dispositivo', 15, currentY);
    currentY += 6;

    const deviceDetails = [
        ['Equipo:', `${repair.brand_name || repair.brand_other || ''} ${repair.model || ''}`],
        ['Serie/IMEI:', repair.imei || repair.serial_number || 'N/A'],
        ['Color:', repair.color || 'N/A'],
        ['Contraseña:', repair.device_password || 'Ninguna']
    ];

    autoTable(doc, {
        startY: currentY,
        body: deviceDetails,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1, textColor: darkColor },
        columnStyles: { 0: { fontStyle: 'bold', width: 30, textColor: mutedColor } },
        margin: { left: 15 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // --- Section: Recepción e Inspección ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Recepción y Diagnóstico', 15, currentY);
    currentY += 6;

    const receptionDetails = [
        ['Servicio Solicitado:', repair.service_name || repair.service_requested || 'General'],
        ['Problema Reportado:', repair.problem_description || 'N/A'],
        ['Condición Física:', `${repair.physical_condition}/5`],
        ['Daños Previos:', repair.existing_damage || 'Ninguno reportado'],
        ['Accesorios:', repair.accessories_received || 'Ninguno']
    ];

    autoTable(doc, {
        startY: currentY,
        body: receptionDetails,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1, textColor: darkColor },
        columnStyles: { 0: { fontStyle: 'bold', width: 35, textColor: mutedColor } },
        margin: { left: 15 }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // --- Section: Presupuesto ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Presupuesto Estimado', 15, currentY);
    
    const costs = [
        ['Mano de Obra', formatCurrency(repair.labor_cost)],
        ['Refacciones', formatCurrency(repair.parts_cost)],
        ['Diagnóstico', formatCurrency(repair.diagnosis_cost)]
    ];
    if (repair.discount > 0) {
        costs.push(['Descuento', `-${formatCurrency(repair.discount)}`]);
    }

    autoTable(doc, {
        startY: currentY + 4,
        body: costs,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2, textColor: darkColor },
        columnStyles: { 0: { width: 140 }, 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 15, right: 15 }
    });

    currentY = doc.lastAutoTable.finalY + 2;

    // Totals Box
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFillColor(250, 240, 240); // very light red
    doc.rect(120, currentY, pageWidth - 135, 24, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 125, currentY + 6);
    doc.text(formatCurrency(repair.total_cost), pageWidth - 18, currentY + 6, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Anticipo:', 125, currentY + 12);
    doc.text(formatCurrency(repair.advance_payment), pageWidth - 18, currentY + 12, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Resta:', 125, currentY + 20);
    doc.text(formatCurrency(repair.total_cost - repair.advance_payment), pageWidth - 18, currentY + 20, { align: 'right' });

    currentY += 40;

    // --- Signatures ---
    if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
    }

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(10);

    const leftX = 30;
    const rightX = pageWidth - 90;

    // Client Signature
    if (repair.signature_approval) {
        doc.addImage(repair.signature_approval, 'PNG', leftX, currentY, 60, 25);
    }
    doc.setDrawColor(150, 150, 150);
    doc.line(leftX, currentY + 25, leftX + 60, currentY + 25);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma de Conformidad Cliente', leftX + 30, currentY + 30, { align: 'center' });

    // Tech Signature / Stamp Place
    doc.line(rightX, currentY + 25, rightX + 60, currentY + 25);
    doc.text('Firma/Sello de Recepción', rightX + 30, currentY + 30, { align: 'center' });

    // --- Legal Footer ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const terms1 = `TÉRMINOS Y CONDICIONES DE RECEPCIÓN: El cliente acepta que el equipo se recibe únicamente para revisión y/o reparación según lo descrito. ${businessName} no se hace responsable por información no respaldada, memorias, tarjetas SIM o fundas dejadas en el equipo.`;
    const terms2 = `La garantía aplicará exclusivamente sobre las piezas reemplazadas y la mano de obra estipulada, y tiene una duración de ${repair.warranty_days} días a partir de la entrega. Pasados 30 días de la notificación de reparación terminada, causará recargos por almacenaje. A los 60 días, el equipo se considerará abandonado.`;
    
    doc.text(doc.splitTextToSize(terms1, pageWidth - 30), 15, pageHeight - 20);
    doc.text(doc.splitTextToSize(terms2, pageWidth - 30), 15, pageHeight - 12);

    doc.save(`Ticket_Orden_${repair.ticket_number}.pdf`);
};
