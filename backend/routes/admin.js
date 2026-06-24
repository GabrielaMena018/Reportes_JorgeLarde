const express = require("express");
const router = express.Router();

const Reporte = require("../models/Reporte");
const { protegerRuta } = require("../middleware/auth");
const { generarPDFReporte } = require("../utils/pdfGenerator");

// Todas las rutas de admin requieren autenticación
router.use(protegerRuta);

// GET /api/admin/reportes — Listar todos los reportes con filtros
router.get("/reportes", async (req, res) => {
  try {
    const {
      estado,
      prioridad,
      tipo_error,
      buscar,
      pagina = 1,
      limite = 20,
    } = req.query;

    const filtro = {};
    if (estado) filtro.estado = estado;
    if (prioridad) filtro.prioridad = prioridad;
    if (tipo_error) filtro.tipo_error = tipo_error;
    if (buscar) {
      filtro.$or = [
        { nombre_docente: { $regex: buscar, $options: "i" } },
        { numero_ticket: { $regex: buscar, $options: "i" } },
        { descripcion: { $regex: buscar, $options: "i" } },
      ];
    }

    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    const total = await Reporte.countDocuments(filtro);
    const reportes = await Reporte.find(filtro)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    res.json({
      reportes,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo reportes." });
  }
});

// GET /api/admin/reportes/:id — Ver un reporte específico
router.get("/reportes/:id", async (req, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado." });
    res.json(reporte);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo el reporte." });
  }
});

// PATCH /api/admin/reportes/:id — Actualizar estado/notas de un reporte
router.patch("/reportes/:id", async (req, res) => {
  try {
    const { estado, notas_admin, prioridad, resuelto_por } = req.body;
    const actualizaciones = {};

    if (estado) actualizaciones.estado = estado;
    if (notas_admin !== undefined) actualizaciones.notas_admin = notas_admin;
    if (prioridad) actualizaciones.prioridad = prioridad;
    if (resuelto_por) actualizaciones.resuelto_por = resuelto_por;
    if (estado === "Resuelto" || estado === "Cerrado") {
      actualizaciones.fecha_resolucion = new Date();
    }

    const reporte = await Reporte.findByIdAndUpdate(
      req.params.id,
      actualizaciones,
      { new: true, runValidators: true }
    );
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado." });

    res.json({ success: true, reporte });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/reportes/:id/pdf — Descargar PDF de un reporte
router.get("/reportes/:id/pdf", async (req, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado." });

    const pdfBuffer = await generarPDFReporte(reporte);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte-${reporte.numero_ticket}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: "Error generando el PDF." });
  }
});

// GET /api/admin/estadisticas — Dashboard stats
router.get("/estadisticas", async (req, res) => {
  try {
    const [total, porEstado, porPrioridad, porTipo, recientes] = await Promise.all([
      Reporte.countDocuments(),
      Reporte.aggregate([{ $group: { _id: "$estado", count: { $sum: 1 } } }]),
      Reporte.aggregate([{ $group: { _id: "$prioridad", count: { $sum: 1 } } }]),
      Reporte.aggregate([{ $group: { _id: "$tipo_error", count: { $sum: 1 } } }]),
      Reporte.find().sort({ createdAt: -1 }).limit(5).select("numero_ticket nombre_docente tipo_error estado prioridad createdAt"),
    ]);

    res.json({ total, porEstado, porPrioridad, porTipo, recientes });
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo estadísticas." });
  }
});

module.exports = router;
