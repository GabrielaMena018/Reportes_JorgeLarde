require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const reporteRoutes = require("./routes/reportes");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: "Demasiadas solicitudes. Intenta en 15 minutos." },
});
app.use(limiter);

// ── Conexión a MongoDB ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => {
    console.error("❌ Error conectando MongoDB:", err.message);
    process.exit(1);
  });

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Sistema de Reportes de Conexión - API v1.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Manejo de errores global ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
