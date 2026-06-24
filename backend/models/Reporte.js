const mongoose = require("mongoose");

const reporteSchema = new mongoose.Schema(
  {
    // Datos del docente
    nombre_docente: {
      type: String,
      required: [true, "El nombre del docente es requerido"],
      trim: true,
    },
    correo_docente: {
      type: String,
      required: [true, "El correo del docente es requerido"],
      trim: true,
      lowercase: true,
    },

    // Datos del error
    tipo_error: {
      type: String,
      required: [true, "El tipo de error es requerido"],
      enum: [
        "Sin internet",
        "Conexión lenta",
        "WiFi no conecta",
        "Error de plataforma",
        "Equipo no enciende",
        "Error de sistema",
        "Otro",
      ],
    },
    descripcion: {
      type: String,
      required: [true, "La descripción del error es requerida"],
      minlength: [10, "La descripción debe tener al menos 10 caracteres"],
    },
    salon: {
      type: String,
      trim: true,
    },
    fecha_ocurrencia: {
      type: Date,
      required: [true, "La fecha del error es requerida"],
    },
    prioridad: {
      type: String,
      enum: ["Baja", "Media", "Alta", "Crítica"],
      default: "Media",
    },

    // Imagen adjunta (Cloudinary)
    imagen: {
      url: String,
      public_id: String,
      nombre_original: String,
    },

    // Estado del reporte
    estado: {
      type: String,
      enum: ["Pendiente", "En revisión", "Resuelto", "Cerrado"],
      default: "Pendiente",
    },
    notas_admin: {
      type: String,
    },
    resuelto_por: {
      type: String,
    },
    fecha_resolucion: {
      type: Date,
    },

    // Número de ticket generado automáticamente
    numero_ticket: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generar número de ticket antes de guardar
reporteSchema.pre("save", async function (next) {
  if (!this.numero_ticket) {
    const count = await mongoose.model("Reporte").countDocuments();
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    this.numero_ticket = `TKT-${año}${mes}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Reporte", reporteSchema);
