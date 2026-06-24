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

      const AZUL_OSCURO = "#1a2a4a";
      const AZUL_MEDIO  = "#2563eb";
      const ROJO_CRITICO = "#dc2626";
      const VERDE_OK    = "#16a34a";
      const GRIS_CLARO  = "#f1f5f9";
      const GRIS_TEXTO  = "#64748b";

      const colorPrioridad = {
        Baja: VERDE_OK,
        Media: "#d97706",
        Alta: "#ea580c",
        "Critica": ROJO_CRITICO,
      };

      const colorEstado = {
        Pendiente: "#d97706",
        "En revision": AZUL_MEDIO,
        Resuelto: VERDE_OK,
        Cerrado: GRIS_TEXTO,
      };

      // ── ENCABEZADO ────────────────────────────────────────────────────────────
      doc.rect(0, 0, 595, 100).fill(AZUL_OSCURO);

      doc.fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("REPORTE DE ERROR DE CONEXION", 50, 28, { align: "center" });

      doc.fontSize(11)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text("Sistema de Gestion de Incidencias Tecnologicas", 50, 58, { align: "center" });

      doc.roundedRect(195, 72, 200, 22, 4).fill(AZUL_MEDIO);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(11)
        .text(`Ticket: ${reporte.numero_ticket}`, 195, 77, { width: 200, align: "center" });

      // ── BADGES ───────────────────────────────────────────────────────────────
      const yBadge = 115;

      doc.roundedRect(50, yBadge, 110, 22, 4)
        .fill(colorEstado[reporte.estado] || GRIS_TEXTO);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(10)
        .text(`Estado: ${reporte.estado}`, 50, yBadge + 6, { width: 110, align: "center" });

      doc.roundedRect(175, yBadge, 120, 22, 4)
        .fill(colorPrioridad[reporte.prioridad] || "#d97706");
      doc.fillColor("white").font("Helvetica-Bold").fontSize(10)
        .text(`Prioridad: ${reporte.prioridad}`, 175, yBadge + 6, { width: 120, align: "center" });

      doc.fillColor(GRIS_TEXTO).font("Helvetica").fontSize(9)
        .text(
          `Generado: ${new Date().toLocaleDateString("es-SV", { year: "numeric", month: "long", day: "numeric" })}`,
          310, yBadge + 6
        );

      // ── HELPERS ───────────────────────────────────────────────────────────────
      let y = 155;

      const dibujarSeccion = (titulo, yPos) => {
        doc.rect(50, yPos, 495, 24).fill(AZUL_OSCURO);
        doc.fillColor("white").font("Helvetica-Bold").fontSize(11)
          .text(titulo, 60, yPos + 6);
        return yPos + 34;
      };

      const dibujarCampo = (label, valor, x, yPos, ancho = 220) => {
        doc.rect(x, yPos, ancho, 18).fill(GRIS_CLARO);
        doc.fillColor(GRIS_TEXTO).font("Helvetica").fontSize(8)
          .text(label.toUpperCase(), x + 6, yPos + 3);
        doc.fillColor(AZUL_OSCURO).font("Helvetica-Bold").fontSize(10)
          .text(valor || "—", x + 6, yPos + 9, { width: ancho - 12 });
        return yPos + 26;
      };

      // ── SECCION: DATOS DEL DOCENTE ────────────────────────────────────────────
      y = dibujarSeccion("INFORMACION DEL DOCENTE", y);

    dibujarCampo("Nombre completo", reporte.nombre_docente, 50, y, 220);
      dibujarCampo("Correo electronico", reporte.correo_docente, 280, y, 265);
      y += 50;

      // ── SECCION: DETALLES DEL ERROR ───────────────────────────────────────────
      y = dibujarSeccion("DETALLES DEL ERROR", y);

      dibujarCampo("Tipo de error", reporte.tipo_error, 50, y, 220);
      dibujarCampo("Salon / Ubicacion", reporte.salon || "No especificado", 280, y, 265);
      y += 50;
      dibujarCampo(
        "Fecha de ocurrencia",
        new Date(reporte.fecha_ocurrencia).toLocaleDateString("es-SV", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        50, y, 495
      );
      y += 50;
      // Descripcion
      doc.rect(50, y, 495, 14).fill(AZUL_OSCURO);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(10)
        .text("DESCRIPCION DEL PROBLEMA", 60, y + 3);
      y += 18;

      const descripcionHeight = Math.max(60, Math.ceil(reporte.descripcion.length / 80) * 14 + 20);
      doc.rect(50, y, 495, descripcionHeight).fill(GRIS_CLARO);
      doc.fillColor(AZUL_OSCURO).font("Helvetica").fontSize(10)
        .text(reporte.descripcion, 60, y + 10, { width: 475, lineGap: 3 });
      y += descripcionHeight + 15;

      // ── NOTAS DEL ADMINISTRADOR ───────────────────────────────────────────────
      if (reporte.notas_admin) {
        y = dibujarSeccion("NOTAS DEL ADMINISTRADOR", y);
        doc.rect(50, y, 495, 50).fill("#f0fdf4");
        doc.rect(50, y, 4, 50).fill(VERDE_OK);
        doc.fillColor(AZUL_OSCURO).font("Helvetica").fontSize(10)
          .text(reporte.notas_admin, 62, y + 10, { width: 475, lineGap: 3 });
        y += 65;
      }

      // ── IMAGEN ADJUNTA ────────────────────────────────────────────────────────
      if (reporte.imagen && reporte.imagen.url) {
        if (y > 580) {
          doc.addPage();
          y = 50;
        }

        y = dibujarSeccion("EVIDENCIA FOTOGRAFICA", y);

        try {
          const imgBuffer = await descargarImagen(reporte.imagen.url);
          const maxAncho = 450;
          const maxAlto = 280;

          doc.rect(50, y, 495, maxAlto + 20).fill(GRIS_CLARO);
          doc.image(imgBuffer, 72, y + 10, {
            fit: [maxAncho, maxAlto],
            align: "center",
            valign: "center",
          });

          y += maxAlto + 30;
        } catch (imgErr) {
          doc.fillColor(ROJO_CRITICO).font("Helvetica").fontSize(10)
            .text("No se pudo cargar la imagen adjunta.", 60, y + 10);
          doc.fillColor(AZUL_MEDIO).text(reporte.imagen.url, 60, y + 25, { link: reporte.imagen.url });
          y += 50;
        }
      }

      // ── PIE DE PAGINA ─────────────────────────────────────────────────────────
      const pageHeight = doc.page.height;
      doc.rect(0, pageHeight - 45, 595, 45).fill(AZUL_OSCURO);
      doc.fillColor("#94a3b8").font("Helvetica").fontSize(8)
        .text(
          `Sistema de Reportes de Incidencias  -  Ticket ${reporte.numero_ticket}  -  ${new Date().getFullYear()}`,
          50, pageHeight - 28,
          { align: "center", width: 495 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generarPDFReporte };