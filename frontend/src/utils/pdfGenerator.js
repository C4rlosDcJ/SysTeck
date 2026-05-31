import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './constants';

export const generateServiceTicket = (repair, settings = {}) => {
    // A4 Format: 210mm x 297mm
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Theme Colors (Modern Premium Slate & Blue Palette)
    const primaryColor = [30, 41, 59];   // Slate 800 (#1e293b)
    const accentColor = [37, 99, 235];   // Blue 600 (#2563eb)
    const darkColor = [15, 23, 42];      // Slate 900 (#0f172a)
    const mutedColor = [100, 116, 139];  // Slate 500 (#64748b)
    const lightBg = [248, 250, 252];     // Slate 50 (#f8fafc)

    const businessName = settings.business_name || 'SysTeck';
    const contactEmail = settings.contact_email || '';
    const contactPhone = settings.contact_phone || '';
    const contactAddress = settings.business_address || '';

    let currentY = 20;

    // --- Elegant Header Banner ---
    // Background accent strip at top
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 12, 'F');

    // Business details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(businessName.toUpperCase(), 15, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    
    let contactInfo = [];
    if (contactPhone) contactInfo.push(`Tel: ${contactPhone}`);
    if (contactEmail) contactInfo.push(contactEmail);
    if (contactAddress) contactInfo.push(contactAddress);
    doc.text(contactInfo.join('  |  '), 15, currentY + 16);

    // Ticket Number & Date (Top Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    const ticketText = `ORDEN DE SERVICIO: #${repair.ticket_number}`;
    const ticketWidth = doc.getTextWidth(ticketText);
    doc.text(ticketText, pageWidth - 15 - ticketWidth, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const dateText = `Fecha Impresión: ${formatDate(new Date())}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - 15 - dateWidth, currentY + 16);

    // Separator line
    currentY += 24;
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 10;

    // --- Side by Side Panels: Client & Device (Using autoTable for alignment) ---
    const clientDetails = [
        ['Nombre:', `${repair.customer_first_name || repair.first_name || ''} ${repair.customer_last_name || repair.last_name || ''}`],
        ['Teléfono:', repair.customer_phone || 'No registrado'],
        ['Email:', repair.customer_email || 'No registrado']
    ];

    const deviceDetails = [
        ['Equipo:', `${repair.brand_name || repair.brand_other || ''} ${repair.model || ''}`.trim()],
        ['Serie/IMEI:', repair.imei || repair.serial_number || 'N/A'],
        ['Color/Capacidad:', `${repair.color || 'N/A'} • ${repair.storage_capacity ? repair.storage_capacity + 'GB' : 'N/A'}`],
        ['Contraseña:', repair.device_password || 'Ninguna']
    ];

    // Client Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('INFORMACIÓN DEL CLIENTE', 15, currentY);
    
    autoTable(doc, {
        startY: currentY + 3,
        body: clientDetails,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 2, textColor: darkColor },
        columnStyles: { 0: { fontStyle: 'bold', width: 25, textColor: mutedColor } },
        margin: { left: 15 },
        tableWidth: 85
    });

    // Device Table
    doc.text('DETALLES DEL EQUIPO', 110, currentY);
    autoTable(doc, {
        startY: currentY + 3,
        body: deviceDetails,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 2, textColor: darkColor },
        columnStyles: { 0: { fontStyle: 'bold', width: 30, textColor: mutedColor } },
        margin: { left: 110 },
        tableWidth: 85
    });

    currentY = Math.max(doc.lastAutoTable.finalY, currentY + 40) + 12;

    // --- Section: Recepción e Inspección ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('RECEPCIÓN Y DIAGNÓSTICO', 15, currentY);
    
    const checklist = typeof repair.function_checklist === 'string' ? JSON.parse(repair.function_checklist) : repair.function_checklist;
    let checklistStr = 'No realizado';
    if (checklist && Object.keys(checklist).length > 0) {
        checklistStr = Object.entries(checklist)
            .map(([k, v]) => `${k.toUpperCase()}: ${v ? 'OK' : 'FALLA'}`)
            .join('  |  ');
    }

    const receptionDetails = [
        ['Servicio Solicitado:', repair.service_name || repair.service_requested || 'General'],
        ['Problema Reportado:', repair.problem_description || 'N/A'],
        ['Condición Física:', `${repair.physical_condition || 5}/5`],
        ['Daños Previos:', repair.existing_damage || 'Ninguno reportado'],
        ['Accesorios Recibidos:', repair.accessories_received || 'Ninguno'],
        ['Checklist Funcional:', checklistStr]
    ];

    autoTable(doc, {
        startY: currentY + 3,
        body: receptionDetails,
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 3, textColor: darkColor },
        headStyles: { fillColor: primaryColor },
        columnStyles: { 0: { fontStyle: 'bold', width: 45, textColor: primaryColor } },
        margin: { left: 15, right: 15 }
    });

    currentY = doc.lastAutoTable.finalY + 12;

    // --- Section: Presupuesto ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PRESUPUESTO ESTIMADO Y COSTOS', 15, currentY);
    
    const costs = [
        ['Servicios / Mano de Obra', formatCurrency(repair.labor_cost)],
        ['Refacciones y Partes', formatCurrency(repair.parts_cost)],
        ['Diagnóstico Técnico', formatCurrency(repair.diagnosis_cost)]
    ];
    if (repair.discount > 0) {
        costs.push(['Descuento Especial', `-${formatCurrency(repair.discount)}`]);
    }

    autoTable(doc, {
        startY: currentY + 3,
        body: costs,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 2.5, textColor: darkColor },
        columnStyles: { 0: { width: 140 }, 1: { halign: 'right', fontStyle: 'bold', textColor: darkColor } },
        margin: { left: 15, right: 15 }
    });

    currentY = doc.lastAutoTable.finalY + 4;

    // Elegant Totals Box
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.rect(115, currentY, pageWidth - 130, 26, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Estimado:', 120, currentY + 6);
    doc.text(formatCurrency(repair.total_cost), pageWidth - 20, currentY + 6, { align: 'right' });
    
    doc.text('Anticipo Recibido:', 120, currentY + 12);
    doc.text(formatCurrency(repair.advance_payment), pageWidth - 20, currentY + 12, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('Monto Restante:', 120, currentY + 20);
    doc.text(formatCurrency(repair.total_cost - repair.advance_payment), pageWidth - 20, currentY + 20, { align: 'right' });

    currentY += 42;

    // --- Signatures ---
    if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = 20;
    }

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(9);

    const leftX = 30;
    const rightX = pageWidth - 90;

    // Client Signature (renders approval or delivery signature if available)
    const activeSignature = repair.signature_delivery || repair.signature_approval;
    if (activeSignature) {
        try {
            doc.addImage(activeSignature, 'PNG', leftX + 5, currentY - 5, 50, 20);
        } catch (e) {
            console.error('Error rendering signature in PDF:', e);
        }
    }
    
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.5);
    doc.line(leftX, currentY + 18, leftX + 60, currentY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma de Conformidad Cliente', leftX + 30, currentY + 23, { align: 'center' });

    // Tech Signature / Stamp Place
    doc.line(rightX, currentY + 18, rightX + 60, currentY + 18);
    doc.text('Sello / Firma de Recepción', rightX + 30, currentY + 23, { align: 'center' });

    // --- Legal Footer ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    
    const terms1 = `TÉRMINOS Y CONDICIONES: El cliente acepta que el equipo se recibe para revisión y diagnóstico. ${businessName} no se hace responsable por pérdida de datos no respaldados previamente, ni por tarjetas SIM, memorias o accesorios no declarados.`;
    const terms2 = `La garantía es válida por ${repair.warranty_days || 30} días sobre mano de obra y refacciones sustituidas. Equipos no reclamados después de 30 días generarán costos de almacenaje. A los 60 días sin reclamo, se considerarán legalmente abandonados.`;
    
    doc.text(doc.splitTextToSize(terms1, pageWidth - 30), 15, pageHeight - 18);
    doc.text(doc.splitTextToSize(terms2, pageWidth - 30), 15, pageHeight - 11);

    doc.save(`Ticket_Orden_${repair.ticket_number}.pdf`);
};
