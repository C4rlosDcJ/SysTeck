const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Templates de email
const emailTemplates = {
    repairCreated: (repair, customer) => ({
        subject: `Sis-Tec - Tu reparación ha sido registrada #${repair.ticket_number}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #171717; color: #EDEDED; padding: 20px; border-radius: 10px;">
        <h1 style="color: #DA0037; text-align: center;">Sis-Tec</h1>
        <h2>¡Hola ${customer.first_name}!</h2>
        <p>Tu dispositivo ha sido registrado para reparación.</p>
        <div style="background: #444444; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Número de ticket:</strong> ${repair.ticket_number}</p>
          <p><strong>Dispositivo:</strong> ${repair.model || 'N/A'}</p>
          <p><strong>Problema:</strong> ${repair.problem_description}</p>
          <p><strong>Estado actual:</strong> Recibido</p>
        </div>
        <p>Te notificaremos cuando haya actualizaciones en tu reparación.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">Este es un correo automático, por favor no responder.</p>
      </div>
    `
    }),

    statusChanged: (repair, customer, newStatus) => ({
        subject: `Sis-Tec - Actualización de tu reparación #${repair.ticket_number}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #171717; color: #EDEDED; padding: 20px; border-radius: 10px;">
        <h1 style="color: #DA0037; text-align: center;">Sis-Tec</h1>
        <h2>¡Hola ${customer.first_name}!</h2>
        <p>El estado de tu reparación ha sido actualizado.</p>
        <div style="background: #444444; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Número de ticket:</strong> ${repair.ticket_number}</p>
          <p><strong>Nuevo estado:</strong> <span style="color: #DA0037;">${getStatusLabel(newStatus)}</span></p>
        </div>
        <p>Gracias por confiar en nosotros.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">Este es un correo automático, por favor no responder.</p>
      </div>
    `
    }),

    repairReady: (repair, customer) => ({
        subject: `Sis-Tec - ¡Tu reparación está lista! #${repair.ticket_number}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #171717; color: #EDEDED; padding: 20px; border-radius: 10px;">
        <h1 style="color: #DA0037; text-align: center;">Sis-Tec</h1>
        <h2>¡Hola ${customer.first_name}!</h2>
        <p style="font-size: 18px; color: #4CAF50;">🎉 ¡Tu dispositivo está listo para ser recogido!</p>
        <div style="background: #444444; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Número de ticket:</strong> ${repair.ticket_number}</p>
          <p><strong>Dispositivo:</strong> ${repair.model || 'N/A'}</p>
          <p><strong>Total a pagar:</strong> $${repair.total_cost}</p>
        </div>
        <p>Puedes pasar a recogerlo en nuestro horario de atención.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">Este es un correo automático, por favor no responder.</p>
      </div>
    `
    })
};

// Mapeo de estados
function getStatusLabel(status) {
    const labels = {
        received: 'Recibido',
        diagnosing: 'En Diagnóstico',
        waiting_approval: 'Esperando Aprobación',
        waiting_parts: 'Esperando Refacciones',
        repairing: 'En Reparación',
        quality_check: 'Control de Calidad',
        ready: 'Listo para Entrega',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
    };
    return labels[status] || status;
}

// Enviar email
async function sendEmail(to, template, data) {
    try {
        const emailContent = emailTemplates[template](data.repair, data.customer, data.newStatus);

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Sis-Tec" <noreply@sistec.com>',
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        });

        console.log('[EMAIL] Email enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EMAIL] Error al enviar email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendEmail,
    emailTemplates,
    getStatusLabel
};
