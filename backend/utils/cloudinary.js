const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un buffer de imagen a Cloudinary
 * @param {Buffer} buffer - El buffer del archivo
 * @param {string} folder - Carpeta destino en Cloudinary
 * @returns {Promise<object>} - Resultado de la subida
 */
const subirImagenACloudinary = (buffer, folder = "reportes_errores") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Elimina una imagen de Cloudinary por su public_id
 */
const eliminarImagenDeCloudinary = async (public_id) => {
  if (!public_id) return;
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (err) {
    console.error("Error eliminando imagen de Cloudinary:", err.message);
  }
};

module.exports = { subirImagenACloudinary, eliminarImagenDeCloudinary };
