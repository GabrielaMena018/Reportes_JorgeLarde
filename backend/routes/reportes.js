const express = require("express");
const multer = require("multer");
const router = express.Router();

const Reporte = require("../models/Reporte");
const { subirImagenACloudinary } = require("../utils/cloudinary");
const { generarPDFReporte } = require("../utils/pdfGenerator");
const { enviarEmailAdmin, enviarConfirmacionDocente } = require("../utils/mailer");

// Multer en memoria (no guarda en disco)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)"));
    }
  },
});

// POST /api/reportes — Crear nuevo reporte
router.post("/", upload.array("imagenes", 2), async (req, res) => {
  try {
    const {
      nombre_docente,
      correo_docente,
      tipo_error,
      descripcion,
      salon,
      fecha_ocurrencia,
      prioridad,
    } = req.body;

    // Validaciones básicas
    if (!nombre_docente || !correo_docente || !tipo_error || !descripcion || !fecha_ocurrencia) {
      return res.status(400).json({ error: "Todos los campos obligatorios deben completarse." });
    }

    // Crear el objeto base del reporte
    const datosReporte = {
      nombre_docente: nombre_docente.trim(),
      correo_docente: correo_docente.trim().toLowerCase(),
      tipo_error,
      descripcion: descripcion.trim(),
      salon: salon?.trim(),
      fecha_ocurrencia: new Date(fecha_ocurrencia),
      prioridad: prioridad || "Media",
    };

    // Subir imagen a Cloudinary si viene adjunta
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map(file => subirImagenACloudinary(file.buffer, "reportes_errores"))
      );
      datosReporte.imagenes = uploads.map((result, i) => ({
        url: result.secure_url,
        public_id: result.public_id,
        nombre_original: req.files[i].originalname,
      }));
    }

    // Guardar en MongoDB
    const reporte = new Reporte(datosReporte);
    await reporte.save();

    // Generar PDF
    const pdfBuffer = await generarPDFReporte(reporte);

    // Enviar emails en paralelo (sin bloquear la respuesta)
    Promise.all([
      enviarEmailAdmin(reporte, pdfBuffer),
      enviarConfirmacionDocente(reporte),
    ]).catch((err) => {
      console.error("Error enviando emails:", err.message);
    });

    res.status(201).json({
      success: true,
      mensaje: "Reporte creado exitosamente. Recibirás una confirmación por correo.",
      ticket: reporte.numero_ticket,
      id: reporte._id,
    });
  } catch (err) {
    console.error("Error creando reporte:", err);
    res.status(500).json({ error: err.message || "Error al crear el reporte." });
  }
});

// GET /api/reportes/:ticket — Consultar estado de un ticket (público)
router.get("/ticket/:ticket", async (req, res) => {
  try {
    const reporte = await Reporte.findOne({ numero_ticket: req.params.ticket }).select(
      "numero_ticket nombre_docente tipo_error estado prioridad createdAt fecha_ocurrencia"
    );
    if (!reporte) {
      return res.status(404).json({ error: "Ticket no encontrado." });
    }
    res.json(reporte);
  } catch (err) {
    res.status(500).json({ error: "Error buscando el ticket." });
  }
});

module.exports = router;
