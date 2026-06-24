const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const enviarEmailAdmin = async (reporte, pdfBuffer) => {
  const colorPrioridad = {
    Baja: "#16a34a",
    Media: "#d97706",
    Alta: "#ea580c",
    Crítica: "#dc2626",
  };

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:#1a2a4a;padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">NUEVO REPORTE DE ERROR</h1>
          <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">Sistema de Incidencias Tecnologicas</p>
          <div style="background:#2563eb;display:inline-block;padding:6px 20px;border-radius:20px;margin-top:12px;">
            <span style="color:#fff;font-weight:bold;font-size:14px;">${reporte.numero_ticket}</span>
          </div>
        </div>
        <div style="background:${colorPrioridad[reporte.prioridad]};padding:10px;text-align:center;">
          <span style="color:#fff;font-weight:bold;font-size:13px;">PRIORIDAD: ${reporte.prioridad.toUpperCase()}</span>
        </div>
        <div style="padding:30px;">
          <h3 style="color:#1a2a4a;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Docente</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Nombre:</td>
              <td style="padding:6px 0;color:#1a2a4a;font-weight:bold;font-size:13px;">${reporte.nombre_docente}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Correo:</td>
              <td style="padding:6px 0;color:#2563eb;font-size:13px;">${reporte.correo_docente}</td>
            </tr>
          </table>
          <h3 style="color:#1a2a4a;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-top:20px;">Error Reportado</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Tipo:</td>
              <td style="padding:6px 0;color:#1a2a4a;font-weight:bold;font-size:13px;">${reporte.tipo_error}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Salon:</td>
              <td style="padding:6px 0;color:#1a2a4a;font-size:13px;">${reporte.salon || "No especificado"}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Fecha:</td>
              <td style="padding:6px 0;color:#1a2a4a;font-size:13px;">${new Date(reporte.fecha_ocurrencia).toLocaleDateString("es-SV", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td>
            </tr>
          </table>
          <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:15px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="color:#64748b;font-size:12px;margin:0 0 6px;text-transform:uppercase;font-weight:bold;">Descripcion</p>
            <p style="color:#1a2a4a;font-size:14px;margin:0;line-height:1.6;">${reporte.descripcion}</p>
          </div>
        </div>
        <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#64748b;font-size:12px;margin:0;">El PDF completo esta adjunto a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Sistema de Reportes <onboarding@resend.dev>",
    to: process.env.ADMIN_EMAIL,
    subject: `[${reporte.prioridad}] Nuevo reporte: ${reporte.tipo_error} - ${reporte.numero_ticket}`,
    html,
    attachments: [
      {
        filename: `reporte-${reporte.numero_ticket}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

const enviarConfirmacionDocente = async (reporte) => {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:#1a2a4a;padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Reporte Recibido</h1>
          <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">Tu reporte ha sido registrado exitosamente</p>
        </div>
        <div style="padding:30px;">
          <p style="color:#1a2a4a;font-size:15px;">Hola, <strong>${reporte.nombre_docente}</strong>,</p>
          <p style="color:#475569;font-size:14px;line-height:1.6;">Tu reporte de error de conexion ha sido registrado. El equipo tecnico lo revisara pronto.</p>
          <div style="background:#eff6ff;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
            <p style="color:#2563eb;font-size:13px;margin:0 0 6px;">Numero de ticket</p>
            <p style="color:#1a2a4a;font-size:24px;font-weight:bold;margin:0;letter-spacing:2px;">${reporte.numero_ticket}</p>
          </div>
          <p style="color:#64748b;font-size:13px;">Guarda este numero para dar seguimiento a tu reporte.</p>
        </div>
        <div style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">Sistema de Incidencias Tecnologicas - ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Sistema de Reportes <onboarding@resend.dev>",
    to: reporte.correo_docente,
    subject: `Reporte recibido - Ticket ${reporte.numero_ticket}`,
    html,
  });
};

module.exports = { enviarEmailAdmin, enviarConfirmacionDocente };