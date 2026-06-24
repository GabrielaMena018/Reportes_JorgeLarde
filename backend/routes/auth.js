const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const Admin = require("../models/Admin");
const { protegerRuta } = require("../middleware/auth");

// Rate limit especial para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de inicio de sesión. Intenta en 15 minutos." },
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Usuario y contraseña son requeridos." });
    }

    const admin = await Admin.findOne({ username: username.trim(), activo: true });
    if (!admin) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const passwordValido = await admin.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    // Actualizar último acceso
    admin.ultimo_acceso = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = jwt.sign(
      { id: admin._id, username: admin.username, rol: admin.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      admin: {
        nombre: admin.nombre,
        username: admin.username,
        rol: admin.rol,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// GET /api/auth/me — Verificar token actual
router.get("/me", protegerRuta, (req, res) => {
  res.json({
    nombre: req.admin.nombre,
    username: req.admin.username,
    rol: req.admin.rol,
  });
});

// POST /api/auth/setup — Crear admin inicial (solo si no hay ninguno)
router.post("/setup", async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({ error: "Ya existe un administrador configurado." });
    }

    const admin = await Admin.create({
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || "Admin2024!",
      nombre: "Administrador Principal",
      correo: process.env.ADMIN_EMAIL,
      rol: "superadmin",
    });

    res.status(201).json({
      success: true,
      mensaje: "Administrador creado. Cambia la contraseña inmediatamente.",
      username: admin.username,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
