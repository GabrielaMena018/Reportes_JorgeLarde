const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    nombre: {
      type: String,
      required: true,
    },
    correo: {
      type: String,
      required: true,
      unique: true,
    },
    rol: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
    activo: {
      type: Boolean,
      default: true,
    },
    ultimo_acceso: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash de contraseña antes de guardar
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Método para comparar contraseñas
adminSchema.methods.compararPassword = async function (candidato) {
  return bcrypt.compare(candidato, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
