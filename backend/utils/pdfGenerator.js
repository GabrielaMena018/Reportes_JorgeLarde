const PDFDocument = require("pdfkit");
const https = require("https");
const http = require("http");

const descargarImagen = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
};

const generarPDFReporte = async (reporte) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const AZUL_OSCURO  = "#1a2a4a";
      const AZUL_MEDIO   = "#2563eb";
      const ROJO_CRITICO = "#dc2626";
      const VERDE_OK     = "#16a34a";
      const GRIS_CLARO   = "#f1f5f9";
      const GRIS_TEXTO   = "#64748b";
      const BLANCO       = "#ffffff";

      const colorPrioridad = {
        Baja: VERDE_OK,
        Media: "#d97706",
        Alta: "#ea580c",
        Critica: ROJO_CRITICO,
      };

      const colorEstado = {
        Pendiente: "#d97706",
        "En revision": AZUL_MEDIO,
        Resuelto: VERDE_OK,
        Cerrado: GRIS_TEXTO,
      };

      // ── ENCABEZADO ────────────────────────────────────────────────────────────
      doc.rect(0, 0, 595, 110).fill(AZUL_OSCURO);

      doc.fillColor(BLANCO)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("REPORTE DE ERROR DE CONEXION", 50, 25, { align: "center" });

      doc.font("Helvetica")
        .fontSize(10)
        .fillColor("#94a3b8")
        .text("Sistema de Gestion de Incidencias Tecnologicas", 50, 52, { align: "center" });

      // Ticket badge
      doc.roundedRect(197, 68, 200, 26, 5).fill(AZUL_MEDIO);
      doc.fillColor(BLANCO).font("Helvetica-Bold").fontSize(12)
        .text(`Ticket: ${reporte.numero_ticket}`, 197, 74, { width: 200, align: "center" });

      // ── BADGES ESTADO Y PRIORIDAD ─────────────────────────────────────────────
      const yBadge = 125;

      doc.roundedRect(50, yBadge, 120, 24, 5)
        .fill(colorEstado[reporte.estado] || GRIS_TEXTO);
      doc.fillColor(BLANCO).font("Helvetica-Bold").fontSize(10)
        .text(`Estado: ${reporte.estado}`, 50, yBadge + 7, { width: 120, align: "center" });

      doc.roundedRect(185, yBadge, 130, 24, 5)
        .fill(colorPrioridad[reporte.prioridad] || "#d97706");
      doc.fillColor(BLANCO).font("Helvetica-Bold").fontSize(10)
        .text(`Prioridad: ${reporte.prioridad}`, 185, yBadge + 7, { width: 130, align: "center" });

      doc.fillColor(GRIS_TEXTO).font("Helvetica").fontSize(9)
        .text(
          `Generado: ${new Date().toLocaleDateString("es-SV", {
            year: "numeric", month: "long", day: "numeric"
          })}`,
          330, yBadge + 8
        );

      // ── HELPERS ───────────────────────────────────────────────────────────────
      let y = 170;

      const dibujarSeccion = (titulo, yPos) => {
        doc.rect(50, yPos, 495, 28).fill(AZUL_OSCURO);
        doc.fillColor(BLANCO).font("Helvetica-Bold").fontSize(11)
          .text(titulo, 62, yPos + 8);
        return yPos + 40;
      };

      const dibujarCampo = (label, valor, x, yPos, ancho = 220) => {
        // Fondo del campo
        doc.rect(x, yPos, ancho, 40).fill(GRIS_CLARO);
        // Borde izquierdo decorativo
        doc.rect(x, yPos, 3, 40).fill(AZUL_MEDIO);
        // Label
        doc.fillColor(GRIS_TEXTO).font("Helvetica").fontSize(8)
          .text(label.toUpperCase(), x + 10, yPos + 7);
        // Valor
        doc.fillColor(AZUL_OSCURO).font("Helvetica-Bold").fontSize(11)
          .text(valor || "—", x + 10, yPos + 20, { width: ancho - 16 });
      };

      // ── SECCION: DATOS DEL DOCENTE ────────────────────────────────────────────
      y = dibujarSeccion("INFORMACION DEL DOCENTE", y);

      dibujarCampo("Nombre completo", reporte.nombre_docente, 50, y, 240);
      dibujarCampo("Correo electronico", reporte.correo_docente, 305, y, 240);
      y += 60;

      // ── SECCION: DETALLES DEL ERROR ───────────────────────────────────────────
      y = dibujarSeccion("DETALLES DEL ERROR", y);

      dibujarCampo("Tipo de error", reporte.tipo_error, 50, y, 240);
      dibujarCampo("Salon / Aula", reporte.salon || "No especificado", 305, y, 240);
      y += 60;

      dibujarCampo(
        "Fecha de ocurrencia",
        new Date(reporte.fecha_ocurrencia).toLocaleDateString("es-SV", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        50, y, 495
      );
      y += 60;

      // ── DESCRIPCION ───────────────────────────────────────────────────────────
      doc.rect(50, y, 495, 28).fill(AZUL_OSCURO);
      doc.fillColor(BLANCO).font("Helvetica-Bold").fontSize(11)
        .text("DESCRIPCION DEL PROBLEMA", 62, y + 8);
      y += 36;

      const descripcionHeight = Math.max(70, Math.ceil(reporte.descripcion.length / 75) * 16 + 28);
      doc.rect(50, y, 495, descripcionHeight).fill(GRIS_CLARO);
      doc.rect(50, y, 3, descripcionHeight).fill(AZUL_MEDIO);
      doc.fillColor(AZUL_OSCURO).font("Helvetica").fontSize(11)
        .text(reporte.descripcion, 62, y + 14, { width: 468, lineGap: 5 });
      y += descripcionHeight + 20;

      // ── NOTAS DEL ADMINISTRADOR ───────────────────────────────────────────────
      if (reporte.notas_admin) {
        y = dibujarSeccion("NOTAS DEL ADMINISTRADOR", y);
        const notasHeight = Math.max(60, Math.ceil(reporte.notas_admin.length / 75) * 16 + 28);
        doc.rect(50, y, 495, notasHeight).fill("#f0fdf4");
        doc.rect(50, y, 3, notasHeight).fill(VERDE_OK);
        doc.fillColor(AZUL_OSCURO).font("Helvetica").fontSize(11)
          .text(reporte.notas_admin, 62, y + 14, { width: 468, lineGap: 5 });
        y += notasHeight + 20;
      }

      // ── IMAGEN ADJUNTA ────────────────────────────────────────────────────────
      if (reporte.imagen && reporte.imagen.url) {
        if (y > 560) {
          doc.addPage();
          y = 50;
        }

        y = dibujarSeccion("EVIDENCIA FOTOGRAFICA", y);

        try {
          const imgBuffer = await descargarImagen(reporte.imagen.url);
          const maxAncho = 460;
          const maxAlto  = 280;

          doc.rect(50, y, 495, maxAlto + 24).fill(GRIS_CLARO);
          doc.image(imgBuffer, 67, y + 12, {
            fit: [maxAncho, maxAlto],
            align: "center",
            valign: "center",
          });

          y += maxAlto + 36;
        } catch (imgErr) {
          doc.fillColor(ROJO_CRITICO).font("Helvetica").fontSize(10)
            .text("No se pudo cargar la imagen adjunta.", 62, y + 12);
          y += 40;
        }
      }

      // ── PIE DE PAGINA ─────────────────────────────────────────────────────────
      const pageHeight = doc.page.height;
      doc.rect(0, pageHeight - 48, 595, 48).fill(AZUL_OSCURO);
      doc.fillColor("#94a3b8").font("Helvetica").fontSize(9)
        .text(
          `Sistema de Reportes de Incidencias  -  Ticket ${reporte.numero_ticket}  -  ${new Date().getFullYear()}`,
          50, pageHeight - 30,
          { align: "center", width: 495 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generarPDFReporte };