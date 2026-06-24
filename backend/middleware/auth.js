const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protegerRuta = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Acceso no autorizado. Token requerido." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin || !admin.activo) {
      return res.status(401).json({ error: "Administrador no válido o inactivo." });
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Sesión expirada. Inicia sesión nuevamente." });
    }
    return res.status(401).json({ error: "Token inválido." });
  }
};

module.exports = { protegerRuta };
